import { Buffer } from "node:buffer";

const LOCAL_FILE_HEADER = 0x04034b50;
const CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i += 1) {
  let c = i;
  for (let j = 0; j < 8; j += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) {
    c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const dosDateTime = (date) => {
  const year = Math.max(1980, date.getFullYear());
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const day = (year - 1980) << 9 | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
};

const writeUInt16 = (value) => {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(value & 0xffff, 0);
  return buf;
};

const writeUInt32 = (value) => {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value >>> 0, 0);
  return buf;
};

export class ZipStore {
  #entries = [];

  addFile(name, contents) {
    const data = Buffer.isBuffer(contents) ? contents : Buffer.from(String(contents));
    this.#entries.push({ name: name.replace(/^\/+/, ""), data, date: new Date() });
  }

  toBuffer() {
    const parts = [];
    const central = [];
    let offset = 0;

    for (const entry of this.#entries) {
      const name = Buffer.from(entry.name, "utf8");
      const crc = crc32(entry.data);
      const { time, day } = dosDateTime(entry.date);
      const local = Buffer.concat([
        writeUInt32(LOCAL_FILE_HEADER),
        writeUInt16(20),
        writeUInt16(0x0800),
        writeUInt16(0),
        writeUInt16(time),
        writeUInt16(day),
        writeUInt32(crc),
        writeUInt32(entry.data.length),
        writeUInt32(entry.data.length),
        writeUInt16(name.length),
        writeUInt16(0),
        name,
      ]);
      parts.push(local, entry.data);

      central.push(Buffer.concat([
        writeUInt32(CENTRAL_DIRECTORY_HEADER),
        writeUInt16(20),
        writeUInt16(20),
        writeUInt16(0x0800),
        writeUInt16(0),
        writeUInt16(time),
        writeUInt16(day),
        writeUInt32(crc),
        writeUInt32(entry.data.length),
        writeUInt32(entry.data.length),
        writeUInt16(name.length),
        writeUInt16(0),
        writeUInt16(0),
        writeUInt16(0),
        writeUInt16(0),
        writeUInt32(0),
        writeUInt32(offset),
        name,
      ]));

      offset += local.length + entry.data.length;
    }

    const centralOffset = offset;
    const centralBuf = Buffer.concat(central);
    const end = Buffer.concat([
      writeUInt32(END_OF_CENTRAL_DIRECTORY),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(this.#entries.length),
      writeUInt16(this.#entries.length),
      writeUInt32(centralBuf.length),
      writeUInt32(centralOffset),
      writeUInt16(0),
    ]);

    return Buffer.concat([...parts, centralBuf, end]);
  }
}
