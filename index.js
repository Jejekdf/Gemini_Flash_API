const express = require('express');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai'); 
const multer = require('multer'); 
const fs = require('fs');
const path = require('path');

dotenv.config();
const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); 
const upload=multer({dest:'uploads/'})

const PORT = 3000;
app.listen(PORT, () => {
  console.log(` Gemini Api Server is running at http://localhost:${PORT}`);
});

app.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ output: response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('generate-image',upload.single('image')),async(req,res)=>{
  const prompt= req.body.prompt;
  const image= imageToGenerativePart(req.file.path);

  try {
    const result = await model.generateImage(prompt, image);
    const response = await result.response;
    res.json({ output: response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }finally{
    fs.unlinkSync(req.file.path);
  }
  
};

app.post('/generate-from-document',upload.single('document'),async(req,res)=>{
 const filePath = req.file.path;
 const buffer = fs.readFileSync(filePath);
 const base64data = buffer.toString('base64');
 const mimtype = req.file.mimetype;

try {
  const documentPart ={
    inlineData:{data:base64data,mimeType:mimtype}
  };
  const result = await model.generateContent(['analyze this document:',documentPart])
  const response = await result.response;
  res.json({ output: response.text() });
}catch (err) {
  res.status(500).json({ error: err.message });
}finally{
  fs.unlinkSync(req.file.path);
}
});

app.post('/generate-from-audio',upload.single('audio'),async(req,res)=>{
  const audioBuffer = fs.readFileSync(req.file.path);
  const base64audio = audioBuffer.toString('base64');
  const audioPart = {
    inlineData: {
      data: base64audio,
      mimeType: req.file.mimetype
    }
  };

  try {
    const result = await model.generateContent(['transcribe or analyze this audio:', audioPart]);
    const response = await result.response;
    res.json({ output: response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});