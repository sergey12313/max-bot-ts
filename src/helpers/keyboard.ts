import * as button from './buttons.js';

export const inlineKeyboard = (buttons: unknown) => {
  return {
    type: 'inline_keyboard',
    payload: { buttons },
  };
};

export { button };
