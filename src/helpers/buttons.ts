export const callback = (text: string, payload: string, extra?: Record<string, unknown>) => {
  return {
    type: 'callback',
    text,
    payload,
    ...extra,
  };
};

export const link = (text: string, url: string) => {
  return {
    type: 'link',
    text,
    url,
  };
};

export const requestContact = (text: string, extra?: Record<string, unknown>) => {
  return {
    type: 'request_contact',
    text,
    ...extra,
  };
};

export const requestGeoLocation = (text: string, extra?: Record<string, unknown>) => {
  return {
    type: 'request_geo_location',
    text,
    ...extra,
  };
};

export const chat = (text: string, chatTitle: string | number, extra?: Record<string, unknown>) => {
  return {
    type: 'chat',
    text,
    chat_title: chatTitle,
    ...extra,
  };
};
