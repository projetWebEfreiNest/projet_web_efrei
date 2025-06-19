# Invoice API Documentation

## Endpoints

### REST API

- `POST /invoices` - Créer une nouvelle facture avec fichier
- `GET /invoices?page=1&limit=10` - Lister les factures avec pagination
- `GET /invoices/:id` - Récupérer une facture spécifique
- `PUT /invoices/:id` - Mettre à jour une facture avec nouveau fichier (optionnel)
- `DELETE /invoices/:id` - Supprimer une facture

### GraphQL API

#### Queries

```graphql
query GetInvoices($page: Int = 1, $limit: Int = 10) {
  invoices(page: $page, limit: $limit) {
    invoices {
      id
      name
      filePath
      createdAt
      date
      type
      invoiceData {
        id
        content
        amount
      }
    }
    total
    page
    limit
    totalPages
  }
}

query GetInvoice($id: Int!) {
  invoice(id: $id) {
    id
    name
    filePath
    createdAt
    date
    type
    invoiceData {
      id
      content
      amount
    }
  }
}
```

#### Mutations

```graphql
mutation CreateInvoice($createInvoiceInput: CreateInvoiceInput!) {
  createInvoice(createInvoiceInput: $createInvoiceInput) {
    id
    name
    filePath
    createdAt
    date
    type
  }
}

mutation UpdateInvoice($updateInvoiceInput: UpdateInvoiceInput!) {
  updateInvoice(updateInvoiceInput: $updateInvoiceInput) {
    id
    name
    filePath
    createdAt
    date
    type
  }
}

mutation RemoveInvoice($id: Int!) {
  removeInvoice(id: $id)
}
```

## Modèles de données

### CreateInvoiceInput

```json
{
  "name": "string",
  "date": "Date",
  "type": "EMIS | RECUS",
  "invoiceData": [
    {
      "content": "string",
      "amount": "number"
    }
  ],
  "tagIds": [1, 2, 3]
}
```

### Types de fichiers supportés

- PDF (.pdf)
- Images (.jpg, .jpeg, .png, .gif)
- Documents Word (.doc, .docx)

### Taille maximale

- 10MB par fichier

## Variables d'environnement requises

```bash
AWS_REGION="eu-west-3"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
S3_BUCKET_NAME="invoice-files"
```
