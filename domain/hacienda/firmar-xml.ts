/**
 * Firma XML con XAdES-BES usando la llave .p12 del contribuyente.
 * Requiere Node.js 18+ (WebCrypto nativo).
 */

// OIDs PKCS#12 para identificar los tipos de bolsas
const OID_PKCS8_SHROUDED_KEY_BAG = "1.2.840.113549.1.12.10.1.2";
const OID_CERT_BAG               = "1.2.840.113549.1.12.10.1.3";

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export interface FirmarXMLInput {
  xmlSinFirmar: string;
  certificadoP12Buffer: Buffer;
  pinCertificado: string;
}

export interface FirmarXMLResult {
  xmlFirmado?: string;
  error?: string;
}

// ─── Función principal ────────────────────────────────────────────────────────

export async function firmarXML(input: FirmarXMLInput): Promise<FirmarXMLResult> {
  try {
    const { privateKey, certDerBase64 } = await cargarP12(
      input.certificadoP12Buffer,
      input.pinCertificado
    );
    const xmlFirmado = await aplicarFirmaXAdES(input.xmlSinFirmar, privateKey, certDerBase64);
    return { xmlFirmado };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

// ─── Extracción de .p12 (pkijs 3.x) ──────────────────────────────────────────

interface P12Extracted {
  privateKey: CryptoKey;
  certDerBase64: string; // DER del certificado codificado en base64 (para xadesjs)
}

async function cargarP12(p12Buffer: Buffer, pin: string): Promise<P12Extracted> {
  const asn1 = await import("asn1js");
  const pkijs = await import("pkijs");

  const subtle = globalThis.crypto.subtle;
  const passwordBuffer = new TextEncoder().encode(pin).buffer as ArrayBuffer;

  // Convertir Buffer a ArrayBuffer limpio
  const p12ArrayBuffer = p12Buffer.buffer.slice(
    p12Buffer.byteOffset,
    p12Buffer.byteOffset + p12Buffer.byteLength
  ) as ArrayBuffer;

  // Parsear PKCS#12
  const { result: pfxAsn1 } = asn1.fromBER(p12ArrayBuffer);
  const pfx = new pkijs.PFX({ schema: pfxAsn1 });

  await pfx.parseInternalValues({ checkIntegrity: false, password: passwordBuffer });

  if (!pfx.parsedValue?.authenticatedSafe) {
    throw new Error("No se pudo parsear el PKCS#12: estructura inválida");
  }

  const authSafe = pfx.parsedValue.authenticatedSafe;

  // Extraer todas las bolsas de los SafeContents
  let shroudedKeyBag: InstanceType<typeof pkijs.PKCS8ShroudedKeyBag> | undefined;
  let certBagDer: ArrayBuffer | undefined;

  for (const safeContent of authSafe.safeContents) {
    const parsed = await parseSafeContent(safeContent, passwordBuffer, pkijs, asn1);
    if (parsed.shroudedKeyBag) shroudedKeyBag = parsed.shroudedKeyBag;
    if (parsed.certDer) certBagDer = parsed.certDer;
  }

  if (!shroudedKeyBag) throw new Error("No se encontró llave privada en el .p12");
  if (!certBagDer) throw new Error("No se encontró certificado en el .p12");

  // Desencriptar la llave privada
  await (shroudedKeyBag as InstanceType<typeof pkijs.PKCS8ShroudedKeyBag> & {
    parseInternalValues(params: { password: ArrayBuffer }): Promise<void>;
  }).parseInternalValues({ password: passwordBuffer });

  if (!shroudedKeyBag.parsedValue) {
    throw new Error("No se pudo desencriptar la llave privada (PIN incorrecto?)");
  }

  // Exportar como PKCS#8 DER e importar como CryptoKey
  const keyDer = shroudedKeyBag.parsedValue.toSchema().toBER(false);
  const privateKey = await subtle.importKey(
    "pkcs8",
    keyDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const certDerBase64 = Buffer.from(new Uint8Array(certBagDer)).toString("base64");

  return { privateKey, certDerBase64 };
}

// ─── Helper: parsear un SafeContent ──────────────────────────────────────────

async function parseSafeContent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contentInfo: any,
  password: ArrayBuffer,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pkijs: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  asn1: any
): Promise<{
  shroudedKeyBag?: InstanceType<typeof import("pkijs").PKCS8ShroudedKeyBag>;
  certDer?: ArrayBuffer;
}> {
  let innerContent = contentInfo;

  // Si el ContentInfo está cifrado (EncryptedData), descifrarlo primero
  if (contentInfo instanceof pkijs.ContentInfo) {
    if (contentInfo.contentType === pkijs.ContentInfo.ENCRYPTED_DATA) {
      const encData = new pkijs.EncryptedData({ schema: contentInfo.content });
      await encData.decrypt({ password });
      const { result } = asn1.fromBER(encData.encryptedContentInfo.encryptedContent?.getValue() ?? new ArrayBuffer(0));
      innerContent = new pkijs.SafeContents({ schema: result });
    } else {
      const { result } = asn1.fromBER(contentInfo.content.valueBlock.valueBeforeDecodeView.buffer);
      innerContent = new pkijs.SafeContents({ schema: result });
    }
  }

  if (!(innerContent instanceof pkijs.SafeContents)) {
    return {};
  }

  let shroudedKeyBag;
  let certDer;

  for (const bag of innerContent.safeBags) {
    if (bag.bagId === OID_PKCS8_SHROUDED_KEY_BAG) {
      shroudedKeyBag = bag.bagValue as InstanceType<typeof pkijs.PKCS8ShroudedKeyBag>;
    } else if (bag.bagId === OID_CERT_BAG) {
      const certBag = bag.bagValue as InstanceType<typeof pkijs.CertBag>;
      if (certBag.parsedValue instanceof pkijs.Certificate) {
        certDer = certBag.parsedValue.toSchema().toBER(false);
      }
    }
  }

  return { shroudedKeyBag, certDer };
}

// ─── Firma XAdES-BES con xmldsigjs + xadesjs ─────────────────────────────────

async function aplicarFirmaXAdES(
  xmlString: string,
  privateKey: CryptoKey,
  certDerBase64: string
): Promise<string> {
  const { Application } = await import("xmldsigjs");
  const { SignedXml } = await import("xadesjs");
  const { DOMParser, XMLSerializer } = await import("@xmldom/xmldom");

  // Usar el WebCrypto nativo de Node.js 18+
  Application.setEngine("NodeJS", globalThis.crypto as Crypto);

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");

  const signedXml = new SignedXml();
  await signedXml.Sign(
    { name: "RSASSA-PKCS1-v1_5" },
    privateKey,
    doc as unknown as Document,
    {
      references: [
        {
          hash: "SHA-256",
          transforms: ["enveloped", "c14n"],
        },
      ],
      // XAdES-BES: incluir certificado en la firma
      signingCertificate: certDerBase64,
    }
  );

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc as unknown as Node);
}
