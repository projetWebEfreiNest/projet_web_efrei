# Documentation Backend Invoice API pour Frontend Next.js

## 🎯 Contexte du Projet

J'ai développé un module complet de gestion des factures (invoices) dans une API NestJS avec GraphQL et REST. Cette API gère l'upload de fichiers vers AWS S3, l'authentification JWT, et la persistance avec Prisma/PostgreSQL.

## 🏗️ Architecture Backend

### Technologies utilisées

- **NestJS** avec TypeScript
- **GraphQL** (Apollo Server)
- **REST API** pour les uploads de fichiers
- **Prisma ORM** avec PostgreSQL
- **AWS S3** pour le stockage des fichiers
- **JWT** pour l'authentification
- **Multer** pour la gestion des uploads

### Structure de la base de données

```prisma
model Invoice {
  id          Int           @id @default(autoincrement())
  name        String
  filePath    String?       // Chemin S3 du fichier
  createdAt   DateTime      @default(now())
  date        DateTime      // Date de la facture
  type        InvoiceType   // EMIS ou RECUS

  invoiceData InvoiceData[] // Données de facturation
  invoiceTags InvoiceTag[]  // Tags associés
  user        User          @relation(fields: [userId], references: [id])
  userId      Int
}

model InvoiceData {
  id         Int       @id @default(autoincrement())
  content    String    // Description de l'item
  amount     Float     // Montant
  invoice    Invoice   @relation(fields: [invoiceId], references: [id])
  invoiceId  Int
}

enum InvoiceType {
  EMIS   // Facture émise
  RECUS  // Facture reçue
}
```

## 🔌 APIs Disponibles

### REST API (recommandé pour les uploads)

| Méthode  | Endpoint                    | Description                    | Body/Params                 |
| -------- | --------------------------- | ------------------------------ | --------------------------- |
| `POST`   | `/invoices`                 | Créer une facture avec fichier | FormData avec 'file' + JSON |
| `GET`    | `/invoices?page=1&limit=10` | Lister avec pagination         | Query params                |
| `GET`    | `/invoices/:id`             | Récupérer une facture          | Param :id                   |
| `PUT`    | `/invoices/:id`             | Mettre à jour                  | FormData avec 'file' + JSON |
| `DELETE` | `/invoices/:id`             | Supprimer                      | Param :id                   |

### GraphQL API

```graphql
# Queries
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

# Mutations
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

## 📋 Modèles de Données

### CreateInvoiceInput

```typescript
{
  name: string;                    // Nom de la facture
  date: Date;                      // Date de la facture
  type: "EMIS" | "RECUS";         // Type de facture
  invoiceData?: [                  // Données optionnelles
    {
      content: string;             // Description
      amount: number;              // Montant
    }
  ];
  tagIds?: number[];               // IDs des tags associés
}
```

### Response Invoice

```typescript
{
  id: number;
  name: string;
  filePath?: string;               // Chemin S3 (s3://bucket/path)
  createdAt: Date;
  date: Date;
  type: "EMIS" | "RECUS";
  userId: number;
  invoiceData?: [
    {
      id: number;
      content: string;
      amount: number;
      invoiceId: number;
    }
  ];
}
```

### PaginatedInvoiceResponse

```typescript
{
  invoices: Invoice[];
  total: number;                   // Total d'éléments
  page: number;                    // Page actuelle
  limit: number;                   // Limite par page
  totalPages: number;              // Nombre total de pages
}
```

## 🔐 Authentification

**OBLIGATOIRE** : Toutes les requêtes doivent inclure un token JWT dans l'header :

```
Authorization: Bearer <jwt_token>
```

Le token contient `userId` qui est automatiquement utilisé pour filtrer les données par utilisateur.

## 📁 Gestion des Fichiers

### Types acceptés

- PDF (`.pdf`)
- Images (`.jpg`, `.jpeg`, `.png`, `.gif`)
- Documents Word (`.doc`, `.docx`)

### Contraintes

- Taille max : **10MB**
- Stockage : **AWS S3**
- Format path : `s3://bucket-name/invoices/{userId}/{uuid}.extension`

### Upload REST

```javascript
const formData = new FormData();
formData.append("file", file);
formData.append("name", "Nom de la facture");
formData.append("date", new Date().toISOString());
formData.append("type", "EMIS");

fetch("/invoices", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

## 🚀 Suggestions d'Implémentation Frontend

### 1. Hooks React recommandés

```typescript
// Pour les requêtes
const useInvoices = (page = 1, limit = 10) => { ... }
const useInvoice = (id: number) => { ... }

// Pour les mutations
const useCreateInvoice = () => { ... }
const useUpdateInvoice = () => { ... }
const useDeleteInvoice = () => { ... }
```

### 2. Composants suggérés

- `InvoiceList` - Liste paginée des factures
- `InvoiceCard` - Carte d'affichage d'une facture
- `InvoiceForm` - Formulaire de création/édition
- `FileUpload` - Composant d'upload avec drag & drop
- `InvoiceDetails` - Vue détaillée d'une facture

### 3. Pages suggérées

- `/invoices` - Liste des factures
- `/invoices/new` - Créer une facture
- `/invoices/[id]` - Détails d'une facture
- `/invoices/[id]/edit` - Éditer une facture

### 4. États à gérer

```typescript
interface InvoiceState {
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## 🔧 Configuration Frontend Requise

### Variables d'environnement

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/graphql
```

### Packages recommandés

```json
{
  "@apollo/client": "^3.x", // Pour GraphQL
  "graphql": "^16.x",
  "axios": "^1.x", // Pour REST API
  "react-dropzone": "^14.x", // Pour file upload
  "react-hook-form": "^7.x", // Pour les formulaires
  "zod": "^3.x", // Pour validation
  "@tanstack/react-query": "^4.x" // Pour cache/sync
}
```

## 🎨 UX/UI Recommandations

### Upload de fichier

- Drag & drop zone
- Preview du fichier sélectionné
- Progress bar pendant l'upload
- Validation côté client (taille, type)

### Liste des factures

- Pagination avec navigation
- Filtres par type (EMIS/RECUS)
- Tri par date
- Recherche par nom
- Actions rapides (voir, éditer, supprimer)

### Formulaire de facture

- Validation en temps réel
- Auto-save en draft
- Gestion des erreurs API
- Preview avant soumission

## 🐛 Gestion d'Erreurs

### Codes d'erreur courants

- `401` - Token JWT manquant/invalide
- `403` - Accès refusé (facture d'un autre user)
- `404` - Facture non trouvée
- `400` - Données invalides ou fichier non supporté
- `413` - Fichier trop volumineux

### Messages utilisateur

```typescript
const ERROR_MESSAGES = {
  FILE_TOO_LARGE: "Le fichier ne peut pas dépasser 10MB",
  FILE_TYPE_NOT_ALLOWED: "Type de fichier non supporté",
  INVOICE_NOT_FOUND: "Facture introuvable",
  NETWORK_ERROR: "Erreur de connexion",
};
```

## 📊 Données d'exemple

```typescript
const exampleInvoice = {
  id: 1,
  name: "Facture Client ABC",
  filePath: "s3://invoices/user123/uuid-123.pdf",
  createdAt: "2025-06-17T10:00:00Z",
  date: "2025-06-15T00:00:00Z",
  type: "EMIS",
  userId: 123,
  invoiceData: [
    {
      id: 1,
      content: "Développement web",
      amount: 1200.0,
      invoiceId: 1,
    },
  ],
};
```

Cette documentation devrait donner tous les éléments nécessaires à votre agent frontend pour implémenter l'interface utilisateur complète !
