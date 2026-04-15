type AttachmentPayload = Record<string, unknown>;

abstract class Attachment {
  abstract toJson(): Record<string, unknown>;
}

export class MediaAttachment extends Attachment {
  token?: string;

  constructor({ token }: { token?: string }) {
    super();
    this.token = token;
  }

  get payload(): AttachmentPayload {
    return { token: this.token };
  }

  toJson(): Record<string, unknown> {
    throw new Error('Attachment not implemented.');
  }
}

export class VideoAttachment extends MediaAttachment {
  readonly type = 'video';

  toJson(): Record<string, unknown> {
    return {
      type: this.type,
      payload: this.payload,
    };
  }
}

export class ImageAttachment extends MediaAttachment {
  private photos?: unknown;
  private url?: string;

  constructor(options: { token: string } | { photos: unknown } | { url: string }) {
    super({ token: 'token' in options ? options.token : undefined });

    if ('photos' in options) {
      this.photos = options.photos;
    }

    if ('url' in options) {
      this.url = options.url;
    }
  }

  override get payload(): AttachmentPayload {
    if (this.token) {
      return { token: this.token };
    }

    if (this.url) {
      return { url: this.url };
    }

    return { photos: this.photos };
  }

  toJson(): Record<string, unknown> {
    return {
      type: 'image',
      payload: this.payload,
    };
  }
}

export class AudioAttachment extends MediaAttachment {
  toJson(): Record<string, unknown> {
    return {
      type: 'audio',
      payload: this.payload,
    };
  }
}

export class FileAttachment extends MediaAttachment {
  toJson(): Record<string, unknown> {
    return {
      type: 'file',
      payload: this.payload,
    };
  }
}

export class StickerAttachment extends Attachment {
  constructor(private readonly code: string) {
    super();
  }

  get payload(): AttachmentPayload {
    return { code: this.code };
  }

  toJson(): Record<string, unknown> {
    return {
      type: 'sticker',
      payload: this.payload,
    };
  }
}

export class LocationAttachment extends Attachment {
  readonly longitude: number;
  readonly latitude: number;

  constructor({ lon, lat }: { lon: number; lat: number }) {
    super();
    this.longitude = lon;
    this.latitude = lat;
  }

  toJson(): Record<string, unknown> {
    return {
      type: 'location',
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }
}

export class ShareAttachment extends Attachment {
  constructor(
    private readonly options: { url?: string; token?: string } = {},
  ) {
    super();
  }

  get payload(): AttachmentPayload {
    return {
      url: this.options.url,
      token: this.options.token,
    };
  }

  toJson(): Record<string, unknown> {
    return {
      type: 'share',
      payload: this.payload,
    };
  }
}
