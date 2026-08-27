const CONTACT_SHEET_NAME = 'お問い合わせ';
const CONTACT_HEADERS = [
  '受信日時',
  'お名前・会社名',
  'メールアドレス',
  '相談カテゴリ',
  '現在困っていること',
  '希望していること',
  '予算感',
  '希望時期',
  '送信元',
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, message: 'リクエスト本文がありません。' });
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (error) {
      console.error('Invalid contact JSON', error);
      return jsonResponse_({ ok: false, message: 'JSONの解析に失敗しました。' });
    }

    const config = getRequiredConfig_();
    if (String(payload._secret || '') !== config.sharedSecret) {
      console.warn('Rejected contact request: shared secret mismatch');
      return jsonResponse_({ ok: false, message: '認証に失敗しました。' });
    }

    const email = String(payload.email || '').trim();
    const problem = String(payload.problem || '').trim();
    const source = String(payload.source || '').trim();
    if (!email || !problem || !source) {
      return jsonResponse_({ ok: false, message: '必須項目が不足しています。' });
    }

    const spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
    const sheet = getOrCreateSheet_(spreadsheet);
    const receivedAt = toValidDate_(payload.receivedAt);

    sheet.appendRow([
      receivedAt,
      sanitizeCell_(payload.name),
      sanitizeCell_(email),
      sanitizeCell_(payload.category),
      sanitizeCell_(problem),
      sanitizeCell_(payload.request),
      sanitizeCell_(payload.budget),
      sanitizeCell_(payload.timing),
      sanitizeCell_(source),
    ]);

    try {
      MailApp.sendEmail({
        to: config.notifyEmail,
        subject: '[TI AUTOMATION STUDIO] 新しいお問い合わせ',
        body: buildNotificationBody_(payload, receivedAt),
        replyTo: email,
        name: 'TI AUTOMATION STUDIO',
      });
    } catch (error) {
      console.error('Contact saved but notification email failed', error);
      return jsonResponse_({ ok: false, message: '問い合わせは保存されましたが、通知メールの送信に失敗しました。' });
    }

    return jsonResponse_({ ok: true });
  } catch (error) {
    console.error('Contact receiver failed', error);
    return jsonResponse_({ ok: false, message: '問い合わせの受信処理に失敗しました。' });
  }
}

function getRequiredConfig_() {
  const properties = PropertiesService.getScriptProperties();
  const sharedSecret = properties.getProperty('CONTACT_SHARED_SECRET');
  const spreadsheetId = properties.getProperty('CONTACT_SPREADSHEET_ID');
  const notifyEmail = properties.getProperty('CONTACT_NOTIFY_EMAIL');

  const missing = [];
  if (!sharedSecret) missing.push('CONTACT_SHARED_SECRET');
  if (!spreadsheetId) missing.push('CONTACT_SPREADSHEET_ID');
  if (!notifyEmail) missing.push('CONTACT_NOTIFY_EMAIL');
  if (missing.length > 0) {
    throw new Error('Missing Script Properties: ' + missing.join(', '));
  }

  return { sharedSecret, spreadsheetId, notifyEmail };
}

function getOrCreateSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(CONTACT_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONTACT_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(CONTACT_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, CONTACT_HEADERS.length).setFontWeight('bold');
  }

  return sheet;
}

function sanitizeCell_(value) {
  const text = String(value == null ? '' : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function toValidDate_(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function buildNotificationBody_(payload, receivedAt) {
  const valueOrBlank = (value) => {
    const text = String(value == null ? '' : value).trim();
    return text || '（未入力）';
  };

  return [
    'TI AUTOMATION STUDIO のWebサイトから新しいお問い合わせが届きました。',
    '',
    '受信日時: ' + Utilities.formatDate(receivedAt, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss'),
    'お名前・会社名: ' + valueOrBlank(payload.name),
    'メールアドレス: ' + valueOrBlank(payload.email),
    '相談カテゴリ: ' + valueOrBlank(payload.category),
    '予算感: ' + valueOrBlank(payload.budget),
    '希望時期: ' + valueOrBlank(payload.timing),
    '',
    '【現在困っていること】',
    valueOrBlank(payload.problem),
    '',
    '【希望していること】',
    valueOrBlank(payload.request),
    '',
    'このメールに返信すると、問い合わせ者のメールアドレス宛てに返信できます。',
  ].join('\n');
}

function jsonResponse_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
