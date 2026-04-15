export interface AttachmentBase {
  type: string;
  [key: string]: unknown;
}

export interface ContactAttachment extends AttachmentBase {
  type: 'contact';
  payload: {
    vcf_info?: string;
    [key: string]: unknown;
  };
}

export interface LocationAttachment extends AttachmentBase {
  type: 'location';
  latitude: number;
  longitude: number;
}

export interface StickerAttachment {
  type: 'sticker';
  width: number;
  height: number;
  payload: {
    url: string;
    code: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ImageAttachment {
  type: 'image';
  payload: {
    token?: string;
    url?: string;
    photos?: unknown;
    [key: string]: unknown;
  };
}

export interface AudioAttachment {
  type: 'audio';
  payload: {
    token?: string;
    [key: string]: unknown;
  };
}

export interface FileAttachment {
  type: 'file';
  payload: {
    token?: string;
    [key: string]: unknown;
  };
}

export interface VideoAttachment {
  type: 'video';
  payload: {
    token?: string;
    [key: string]: unknown;
  };
}

export type MessageAttachment =
  | ContactAttachment
  | LocationAttachment
  | StickerAttachment
  | ImageAttachment
  | AudioAttachment
  | FileAttachment
  | VideoAttachment
  | AttachmentBase;
