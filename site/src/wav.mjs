function text(view, offset, length) {
  let value = '';
  for (let index = 0; index < length; index += 1) value += String.fromCharCode(view.getUint8(offset + index));
  return value;
}

export function parseWavHeader(buffer, fileSize) {
  const view = new DataView(buffer);
  if (view.byteLength < 44) throw new Error('This file is too small to contain a WAV header.');
  const container = text(view, 0, 4);
  if ((container !== 'RIFF' && container !== 'RF64') || text(view, 8, 4) !== 'WAVE') {
    throw new Error('This does not look like a RIFF or RF64 WAV recording.');
  }

  let offset = 12;
  let format;
  let dataBytes;
  let rf64DataBytes;
  while (offset + 8 <= view.byteLength) {
    const id = text(view, offset, 4);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === 'ds64' && size >= 24 && body + 24 <= view.byteLength) {
      rf64DataBytes = Number(view.getBigUint64(body + 8, true));
    }
    if (id === 'fmt ' && size >= 16 && body + 16 <= view.byteLength) {
      let encoding = view.getUint16(body, true);
      if (encoding === 0xfffe && size >= 26 && body + 26 <= view.byteLength) encoding = view.getUint16(body + 24, true);
      format = {
        encoding,
        channels: view.getUint16(body + 2, true),
        sampleRate: view.getUint32(body + 4, true),
        byteRate: view.getUint32(body + 8, true),
        blockAlign: view.getUint16(body + 12, true),
        bitsPerSample: view.getUint16(body + 14, true)
      };
    }
    if (id === 'data') {
      dataBytes = container === 'RF64' && rf64DataBytes ? rf64DataBytes : size;
      if (size === 0xffffffff && !rf64DataBytes) dataBytes = Math.max(0, fileSize - body);
      break;
    }
    const next = body + size + (size % 2);
    if (next <= offset || next > view.byteLength) break;
    offset = next;
  }
  if (!format) throw new Error('The WAV format block was not found in the first part of this file.');
  if (!dataBytes) throw new Error('The WAV audio data block was not found in the first part of this file.');
  if (![1, 3].includes(format.encoding)) throw new Error(`WAV encoding ${format.encoding} is not supported by this planner. The CLI may still support it.`);
  if (!format.channels || !format.sampleRate || !format.byteRate || !format.blockAlign) throw new Error('The WAV header has invalid channel or sample-rate values.');
  const frames = Math.floor(dataBytes / format.blockAlign);
  const duration = frames / format.sampleRate;
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('The WAV header reports no playable audio.');
  return { ...format, container, dataBytes, frames, duration };
}

export function planFixed(duration, chunkSeconds) {
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Recording duration must be greater than zero.');
  if (!Number.isFinite(chunkSeconds) || chunkSeconds < 10 || chunkSeconds > 3600) throw new Error('Clip length must be between 10 and 3,600 seconds.');
  const ranges = [];
  for (let start = 0, index = 1; start < duration; start += chunkSeconds, index += 1) {
    ranges.push({ index, start, end: Math.min(start + chunkSeconds, duration) });
  }
  return ranges;
}

export function clock(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, '0')).join(':');
}
