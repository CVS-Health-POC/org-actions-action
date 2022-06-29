import * as https from 'https';

export class URL {
  constructor(public url: string) {}

  async getContent(): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = https.get(this.url, (response) => {
        if (
          response.statusCode === undefined ||
          response.statusCode < 200 ||
          response.statusCode > 299
        ) {
          const statusCode = response.statusCode?.toString() || '';
          reject(new Error(`Failed to load page, status code: ${statusCode}`));
        }
        const body: unknown[] = [];
        response.on('data', (chunk) => body.push(chunk));
        response.on('end', () => resolve(body.join('')));
      });
      request.on('error', (err) => reject(err));
    });
  }
}
