const { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");

const CACHE_LIFETIME_MS = 12 * 60 * 60 * 1000; // 12 hours

class R2Cache {
  constructor() {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucket = process.env.R2_BUCKET_NAME || 'mtgoracle';


    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error('R2 credentials not configured');
    }

    this.client = new S3Client({
      endpoint,
      region: 'auto',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  getCacheKey(collectorNumber, setCode) {
    return `${setCode.toLowerCase()}_${collectorNumber}.json`;
  }

  async get(collectorNumber, setCode) {
    const key = this.getCacheKey(collectorNumber, setCode);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);
      const body = await response.Body?.transformToString();
      
      if (!body) return null;

      const cacheEntry = JSON.parse(body);
      
      // Check if cache is expired
      if (Date.now() > cacheEntry.expiry) {
        console.log(`Cache expired for ${key}`);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        return null;
      }
      console.error(`Error reading from cache for ${key}:`, error);
      return null;
    }
  }

  async set(collectorNumber, setCode, data) {
    const key = this.getCacheKey(collectorNumber, setCode);
    const now = Date.now();

    const cacheEntry = {
      data,
      timestamp: now,
      expiry: now + CACHE_LIFETIME_MS,
    };

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: JSON.stringify(cacheEntry, null, 2),
        ContentType: 'application/json',
      });

      await this.client.send(command);
    } catch (error) {
      console.error(`Error writing to cache for ${key}:`, error);
      // Don't throw - caching failures shouldn't break the API
    }
  }

  async exists(collectorNumber, setCode) {
    const key = this.getCacheKey(collectorNumber, setCode);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      console.error(`Error checking cache for ${key}:`, error);
      return false;
    }
  }
}

module.exports = { R2Cache };