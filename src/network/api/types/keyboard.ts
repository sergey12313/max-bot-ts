export interface Button {
  type: string;
  text: string;
  [key: string]: unknown;
}

export interface InlineKeyboardAttachment {
  type: 'inline_keyboard';
  payload: {
    buttons: Button[][];
  };
}
