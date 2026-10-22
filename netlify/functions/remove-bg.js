export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed"
      };
    }

    const { image } = JSON.parse(event.body || "{}");

    if (!image) {
      return {
        statusCode: 400,
        body: "No image data received"
      };
    }

    const body = new URLSearchParams();
    body.append("image_file_b64", image);
    body.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVE_BG_API_KEY
      },
      body
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: errorText
      };
    }

    export async function handler(event) {
  try {
    const apiKey = process.env.REMOVE_BG_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: "API key missing"
      };
    }

    const { image } = JSON.parse(event.body);

    // 🔥 FIX: Use URLSearchParams (not JSON, not FormData)
    const formData = new URLSearchParams();
    formData.append("image_file_b64", image);
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey
      },
      body: formData
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Remove.bg error:", text);

      return {
        statusCode: 500,
        body: text
      };
    }

    export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: 'Method Not Allowed'
      };
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: 'Missing REMOVE_BG_API_KEY'
      };
    }

    const { image } = JSON.parse(event.body || '{}');
    if (!image) {
      return {
        statusCode: 400,
        body: 'Missing image data'
      };
    }

    // Detect mime type from base64 header if present, else default to jpeg
    const mimeMatch = event.body.match(/data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const extension = mimeType.split('/')[1] || 'jpg';

    const bytes = Buffer.from(image, 'base64');
    const blob = new Blob([bytes], { type: mimeType });

    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('image_file', blob, `upload.${extension}`);

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('remove.bg error:', response.status, errorText);
      return {
        statusCode: response.status,
        body: errorText
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/png'
      },
      isBase64Encoded: true,
      body: base64
    };
  } catch (error) {
    console.error('Function crash:', error);
    return {
      statusCode: 500,
      body: error?.message || 'Server error'
    };
  }
}