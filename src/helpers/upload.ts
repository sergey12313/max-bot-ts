// @ts-nocheck
import * as fs from 'fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { MaxError } from '../network/api/index.js';

const DEFAULT_UPLOAD_TIMEOUT = 20000;

async function uploadRangeChunk(
  {
    uploadUrl,
    chunk,
    startByte,
    endByte,
    fileSize,
    fileName,
  },
  { signal } = {},
) {
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    body: chunk,
    headers: {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Range': `bytes ${startByte}-${endByte}/${fileSize}`,
      'Content-Type': 'application/x-binary; charset=x-user-defined',
      'X-File-Name': fileName,
      'X-Uploading-Mode': 'parallel',
      Connection: 'keep-alive',
    },
    signal,
  });

  if (uploadRes.status >= 400) {
    const error = await uploadRes.json();
    throw new MaxError(uploadRes.status, error);
  }

  return uploadRes.text();
}

async function uploadRange({ uploadUrl, file }, options) {
  const size = file.contentLength;
  let startByte = 0;
  let endByte = 0;

  for await (const chunk of file.stream) {
    endByte = startByte + chunk.length - 1;
    await uploadRangeChunk(
      {
        uploadUrl,
        startByte,
        endByte,
        chunk,
        fileName: file.fileName,
        fileSize: size,
      },
      options,
    );
    startByte = endByte + 1;
  }
}

async function uploadMultipart({ uploadUrl, file }, { signal } = {}) {
  const body = new FormData();
  body.append('data', {
    [Symbol.toStringTag]: 'File',
    name: file.fileName,
    stream: () => file.stream,
    size: file.contentLength,
  });

  const result = await fetch(uploadUrl, {
    method: 'POST',
    body,
    signal,
  });

  return result.json();
}

export class Upload {
  constructor(private readonly api: any) {}

  private getStreamFromSource = async (source) => {
    if (typeof source === 'string') {
      const stat = await fs.promises.stat(source);
      const fileName = path.basename(source);

      if (!stat.isFile()) {
        throw new Error(`Failed to upload ${fileName}. Not a file`);
      }

      return {
        stream: fs.createReadStream(source),
        fileName,
        contentLength: stat.size,
      };
    }

    if (source instanceof Buffer) {
      return {
        buffer: source,
        fileName: randomUUID(),
      };
    }

    const stat = await fs.promises.stat(source.path);
    const fileName = typeof source.path === 'string' ? path.basename(source.path) : randomUUID();

    return {
      stream: source,
      contentLength: stat.size,
      fileName,
    };
  };

  private upload = async (type, file, options) => {
    const res = await this.api.raw.uploads.getUploadUrl({ type });
    const { url: uploadUrl, token } = res;
    const uploadController = new AbortController();
    const uploadInterval = setTimeout(() => {
      uploadController.abort();
    }, options?.timeout || DEFAULT_UPLOAD_TIMEOUT);

    try {
      if ('stream' in file) {
        return await this.uploadFromStream({
          file,
          uploadUrl,
          abortController: uploadController,
          token,
        });
      }

      return await this.uploadFromBuffer({
        file,
        uploadUrl,
        abortController: uploadController,
      });
    } finally {
      clearTimeout(uploadInterval);
    }
  };

  private uploadFromStream = async ({ file, uploadUrl, token, abortController }) => {
    if (token) {
      await uploadRange({ file, uploadUrl }, abortController);
      return {
        token,
        file,
        uploadUrl,
        abortController,
      };
    }

    return uploadMultipart({ file, uploadUrl }, abortController);
  };

  private uploadFromBuffer = async ({ file, uploadUrl, abortController }) => {
    const formData = new FormData();
    formData.append('data', new Blob([file.buffer]), file.fileName);

    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      signal: abortController?.signal,
    });

    return res.json();
  };

  image = async ({ timeout, ...source }) => {
    if ('url' in source) {
      return { url: source.url };
    }

    const fileBlob = await this.getStreamFromSource(source.source);
    return this.upload('image', fileBlob, { timeout });
  };

  video = async ({ source, ...options }) => {
    const fileBlob = await this.getStreamFromSource(source);
    return this.upload('video', fileBlob, options);
  };

  file = async ({ source, ...options }) => {
    const fileBlob = await this.getStreamFromSource(source);
    return this.upload('file', fileBlob, options);
  };

  audio = async ({ source, ...options }) => {
    const fileBlob = await this.getStreamFromSource(source);
    return this.upload('audio', fileBlob, options);
  };
}
