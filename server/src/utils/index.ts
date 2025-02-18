import crypto from "crypto";

function signData(data: any): { data: any; signature: string } {
  const secret = process.env.JWT_SECRET || "your-secret-key";
  const stringified = JSON.stringify(data);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(stringified)
    .digest("hex");

  return {
    data,
    signature,
  };
}

export { signData };
