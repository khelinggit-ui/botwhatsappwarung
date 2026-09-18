import type { WASocket, WAMessage } from '@whiskeysockets/baileys';
import { generateWAMessageFromContent, generateMessageIDV2 } from '@whiskeysockets/baileys';
import type { proto } from '@whiskeysockets/baileys';

export interface QuickReplyButton {
  id: string;
  displayText: string;
}

export interface InteractiveListRow {
  id: string;
  title: string;
  description?: string;
}

export interface InteractiveListSection {
  title: string;
  rows: InteractiveListRow[];
}

export interface CtaUrlButton {
  displayText: string;
  url: string;
}

export interface CtaCallButton {
  displayText: string;
  phoneNumber: string;
}

/**
 * 1. Quick Reply (maks 3 tombol). Dipakai untuk balas cepat seperti di gambar.
 * Pakai interactiveMessage + nativeFlow quick_reply (buttonsMessage lama sudah deprecated).
 */
export function buildQuickReply(
  body: string,
  buttons: QuickReplyButton[],
  footer?: string,
  headerTitle?: string
): proto.IMessage {
  const sliced = buttons.slice(0, 3);
  const nativeButtons = sliced.map((b) => ({
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({ display_text: b.displayText, id: b.id }),
  }));
  return {
    interactiveMessage: {
      body: { text: body },
      footer: footer ? { text: footer } : undefined,
      header: headerTitle
        ? { title: headerTitle, hasMediaAttachment: false }
        : undefined,
      nativeFlowMessage: { buttons: nativeButtons },
    },
  };
}

/**
 * 2. List Menu (kalau tombol banyak). Pakai nativeFlow single_select.
 */
export function buildListMenu(
  body: string,
  buttonText: string,
  sections: InteractiveListSection[],
  footer?: string,
  headerTitle?: string
): proto.IMessage {
  return {
    interactiveMessage: {
      body: { text: body },
      footer: footer ? { text: footer } : undefined,
      header: headerTitle
        ? { title: headerTitle, hasMediaAttachment: false }
        : undefined,
      nativeFlowMessage: {
        buttons: [
          {
            name: 'single_select',
            buttonParamsJson: JSON.stringify({ title: buttonText, sections }),
          },
        ],
      },
    },
  };
}

/**
 * 3. CTA Button (link / telepon). Maks 2 CTA per pesan, tidak bisa digabung dengan List.
 */
export function buildCta(
  body: string,
  urls: CtaUrlButton[] = [],
  calls: CtaCallButton[] = [],
  footer?: string,
  headerTitle?: string
): proto.IMessage {
  const buttons: Array<{ name: string; buttonParamsJson: string }> = [];
  for (const u of urls.slice(0, 2)) {
    buttons.push({
      name: 'cta_url',
      buttonParamsJson: JSON.stringify({
        display_text: u.displayText,
        url: u.url,
        merchant_url: u.url,
      }),
    });
  }
  // WhatsApp membatasi total CTA; sisa slot untuk call
  const remaining = Math.max(0, 2 - buttons.length);
  for (const c of calls.slice(0, remaining)) {
    buttons.push({
      name: 'cta_call',
      buttonParamsJson: JSON.stringify({
        display_text: c.displayText,
        phone_number: c.phoneNumber,
      }),
    });
  }
  return {
    interactiveMessage: {
      body: { text: body },
      footer: footer ? { text: footer } : undefined,
      header: headerTitle
        ? { title: headerTitle, hasMediaAttachment: false }
        : undefined,
      nativeFlowMessage: { buttons },
    },
  };
}

/** Fallback teks untuk mode webhook (/send hanya kirim teks). */
export function interactiveFallbackText(body: string, labels: string[]): string {
  if (labels.length === 0) return body;
  return `${body}\n\n${labels.map((l, i) => `${i + 1}. ${l}`).join('\n')}`;
}

/** Kirim proto.IMessage interaktif via relayMessage (sendMessage tidak support interactive di Baileys 6.x). */
export async function sendInteractive(
  sock: WASocket,
  jid: string,
  interactive: proto.IMessage
): Promise<void> {
  const userJid = sock.user?.id;
  const waMsg = generateWAMessageFromContent(jid, interactive as any, {
    userJid: userJid!,
    messageId: generateMessageIDV2(userJid),
  } as any);
  const message = (waMsg as any).message;
  const messageId = (waMsg as any).key?.id;
  await sock.relayMessage(jid, message, { messageId });
}

/** Buka bungkus ephemeral / viewOnce / edit agar isi pesan asli terbaca. */
function unwrapMessage(msg: any): any {
  let m = msg;
  for (let i = 0; i < 5 && m; i++) {
    if (m.ephemeralMessage?.message) m = m.ephemeralMessage.message;
    else if (m.viewOnceMessage?.message) m = m.viewOnceMessage.message;
    else if (m.viewOnceMessageV2?.message) m = m.viewOnceMessageV2.message;
    else if (m.protocolMessage?.editedMessage) m = m.protocolMessage.editedMessage;
    else break;
  }
  return m;
}

/**
 * Ambil teks perintah dari semua jenis pesan masuk, termasuk klik tombol.
 * Return id tombol (mis. "PRODUCTS", "ORDER_12") agar bisa dirouting seperti ketikan biasa.
 */
export function extractCommandText(msg: WAMessage['message']): string {
  if (!msg) return '';
  const m: any = unwrapMessage(msg);
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return m.imageMessage.caption ?? '';
  if (m.videoMessage?.caption) return m.videoMessage.caption ?? '';

  const btnResp = (m as any).buttonsResponseMessage;
  if (btnResp?.selectedButtonId) return String(btnResp.selectedButtonId);
  if (btnResp?.selectedDisplayText) return String(btnResp.selectedDisplayText);

  const listResp = (m as any).listResponseMessage;
  if (listResp?.singleSelectReply?.selectedRowId)
    return String(listResp.singleSelectReply.selectedRowId);
  if (listResp?.title) return String(listResp.title);

  const tplReply = (m as any).templateButtonReplyMessage;
  if (tplReply?.selectedId) return String(tplReply.selectedId);

  const interactive = (m as any).interactiveResponseMessage;
  const paramsJson: string | undefined =
    interactive?.nativeFlowResponseMessage?.paramsJson;
  if (paramsJson) {
    try {
      const parsed = JSON.parse(paramsJson);
      if (parsed?.id) return String(parsed.id);
      if (parsed?.selectedRowId) return String(parsed.selectedRowId);
      if (parsed?.display_text) return String(parsed.display_text);
    } catch {
      // abaikan, fallback ke bawah
    }
  }

  return '';
}

// --- Preset siap pakai untuk bot order ---

const SHOP_URL = process.env.SHOP_URL || 'https://tokomu.com';
const SHOP_PHONE = process.env.SHOP_PHONE || '+6281234567890';

export function menuQuickReply(menuText: string): {
  interactive: proto.IMessage;
  fallbackText: string;
} {
  const buttons: QuickReplyButton[] = [
    { id: 'PRODUCTS', displayText: '📦 Produk' },
    { id: 'ORDER', displayText: '🛒 Order' },
    { id: 'MY_ORDERS', displayText: '📋 Pesanan Saya' },
  ];
  return {
    interactive: buildQuickReply(menuText, buttons, 'OrderBot', 'MENU UTAMA'),
    fallbackText: interactiveFallbackText(menuText, [
      'Ketik PRODUCTS',
      'Ketik ORDER',
      'Ketik MY_ORDERS',
    ]),
  };
}

export function cartConfirmQuickReply(cartText: string): {
  interactive: proto.IMessage;
  fallbackText: string;
} {
  const buttons: QuickReplyButton[] = [
    { id: 'LANJUT', displayText: '➕ Lanjut' },
    { id: 'CHECKOUT', displayText: '✅ Checkout' },
    { id: 'CANCEL', displayText: '❌ Batal' },
  ];
  return {
    interactive: buildQuickReply(cartText, buttons, 'Keranjang belanja'),
    fallbackText: interactiveFallbackText(cartText, [
      'Ketik LANJUT',
      'Ketik CHECKOUT',
      'Ketik CANCEL',
    ]),
  };
}

export function checkoutCta(
  successText: string,
  qrisUrl?: string
): { interactive: proto.IMessage; fallbackText: string } | null {
  if (!qrisUrl) return null;
  return {
    interactive: buildCta(
      successText,
      [{ displayText: '🌐 Bayar / Kunjungi Website', url: qrisUrl || SHOP_URL }],
      [{ displayText: '📞 Hubungi Kami', phoneNumber: SHOP_PHONE }],
      'Selesaikan pembayaranmu'
    ),
    fallbackText: `${successText}\n\n🌐 Bayar: ${qrisUrl}\n📞 Hubungi: ${SHOP_PHONE}`,
  };
}
