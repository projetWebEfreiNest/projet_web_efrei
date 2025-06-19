# Workflow Microservices - Invoice Processing

## 🏗️ Architecture

```
Frontend → public_api → ocr_service → text_treatment_service → public_api
         (REST/GraphQL)  (RabbitMQ)     (RabbitMQ)          (RabbitMQ)
```

## 📋 Messages RabbitMQ

### 1. public_api → ocr_service

**Queue**: `ocr_queue`
**Pattern**: `process_invoice`

```json
{
  "invoice_id": 123,
  "content": "base64_encoded_file_content",
  "fileName": "invoice.pdf"
}
```

### 2. ocr_service → text_treatment_service

**Queue**: `text_treatment_queue`
**Pattern**: `analyze_invoice`

```json
{
  "invoice_id": 123,
  "content": "Extracted text from PDF/image..."
}
```

### 3. text_treatment_service → public_api

**Queue**: `invoice_data_queue`
**Pattern**: `invoice_data`

```json
{
  "invoice_id": 123,
  "content": "Description de la ligne de facture",
  "amount": 1200.5
}
```

**Note**: Le text_treatment_service peut envoyer **plusieurs messages** pour une même facture (une ligne par message).

## 🔄 Workflow Détaillé

### 1. **Upload Frontend**

- L'utilisateur upload une facture via REST ou GraphQL
- Le fichier est obligatoire (`BadRequestException` si absent)

### 2. **public_api Processing**

```typescript
// 1. Sauvegarde en base (sans invoice_data)
const invoice = await prisma.invoice.create({
  data: { name, date, type, filePath, userId },
});

// 2. Upload vers S3
const filePath = await s3Service.uploadFile(file, userId);

// 3. Envoi vers OCR
await rabbitMQService.sendToOCR(invoice.id, file.buffer, file.originalname);
```

### 3. **ocr_service Processing**

Le service OCR doit :

```typescript
@MessagePattern('process_invoice')
async processInvoice(@Payload() data: { invoice_id: number; content: string; fileName: string }) {
  // 1. Décoder le base64
  const buffer = Buffer.from(data.content, 'base64');

  // 2. Extraire le texte (OCR/PDF parsing)
  const extractedText = await extractTextFromBuffer(buffer);

  // 3. Envoyer vers text_treatment_service
  this.client.emit('analyze_invoice', {
    invoice_id: data.invoice_id,
    content: extractedText
  });
}
```

### 4. **text_treatment_service Processing**

Le service de traitement de texte doit :

```typescript
@MessagePattern('analyze_invoice')
async analyzeInvoice(@Payload() data: { invoice_id: number; content: string }) {
  // 1. Analyser avec LLM pour extraire les lignes de facture
  const invoiceLines = await analyzWithLLM(data.content);

  // 2. Envoyer chaque ligne vers public_api
  for (const line of invoiceLines) {
    this.client.emit('invoice_data', {
      invoice_id: data.invoice_id,
      content: line.description,
      amount: line.amount
    });
  }
}
```

### 5. **public_api Reception**

```typescript
@MessagePattern('invoice_data')
async handleInvoiceData(@Payload() data: { invoice_id: number; content: string; amount: number }) {
  // Ajouter la ligne de facture en base
  await this.invoiceService.addInvoiceData(data.invoice_id, data.content, data.amount);
}
```

## 🗂️ Structure de Données

### Invoice (création initiale)

```typescript
{
  id: number;
  name: string;
  filePath: string; // S3 path
  date: Date;
  type: "EMIS" | "RECUS";
  userId: number;
  invoiceData: []; // Vide au début, rempli par les microservices
}
```

### InvoiceData (ajoutées par workflow)

```typescript
{
  id: number;
  content: string; // Description de la ligne
  amount: number; // Montant de la ligne
  invoiceId: number;
}
```

## 🔧 Configuration RabbitMQ

### Queues nécessaires

- `ocr_queue` - Messages vers OCR service
- `text_treatment_queue` - Messages vers Text Treatment service
- `invoice_data_queue` - Messages de retour vers public_api

### Variables d'environnement

```bash
RMQ_URL=amqp://guest:guest@localhost:5672
RMQ_OCR_URL=amqp://guest:guest@rabbitmq:5672
RMQ_TEXT_TREATMENT_URL=amqp://guest:guest@rabbitmq:5672
```

## 🚀 Statuts de Processing

Vous pourriez ajouter un statut à Invoice :

```typescript
enum InvoiceStatus {
  UPLOADED = "UPLOADED", // Fichier uploadé
  OCR_PROCESSING = "OCR_PROCESSING", // En cours d'OCR
  TEXT_ANALYSIS = "TEXT_ANALYSIS", // En cours d'analyse LLM
  COMPLETED = "COMPLETED", // Toutes les données extraites
  ERROR = "ERROR", // Erreur dans le workflow
}
```

## 📝 Exemple Complet

1. **Frontend POST** `/invoices` avec fichier PDF
2. **public_api** sauvegarde + upload S3 + emit `process_invoice`
3. **ocr_service** reçoit + extrait texte + emit `analyze_invoice`
4. **text_treatment_service** reçoit + analyse LLM + emit multiple `invoice_data`
5. **public_api** reçoit chaque ligne + sauvegarde en InvoiceData
6. **Frontend GET** `/invoices/:id` pour voir le résultat final
