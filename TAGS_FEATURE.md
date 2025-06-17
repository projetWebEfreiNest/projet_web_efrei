# 🏷️ Fonctionnalité Tags - Documentation Frontend

## 🎯 **Vue d'ensemble**

La fonctionnalité complète de gestion des tags permet aux utilisateurs de :

- ✅ Créer, modifier et supprimer des tags
- ✅ Associer plusieurs tags à chaque facture
- ✅ Filtrer les factures par tags
- ✅ Voir les statistiques d'utilisation des tags

## 🗂️ **Modèle de Données**

### Tag

```typescript
interface Tag {
  id: number;
  name: string; // "Clients", "Fournisseurs", "Urgent"
  description: string; // Description optionnelle
  colors: string; // Code couleur hex "#3B82F6"
  createdAt: Date;
  userId: number;
}
```

### TagWithUsage (pour les statistiques)

```typescript
interface TagWithUsage extends Tag {
  usageCount: number; // Nombre de factures utilisant ce tag
}
```

### Invoice (mise à jour)

```typescript
interface Invoice {
  // ...propriétés existantes
  tags?: Tag[]; // Tags associés à la facture
}
```

## 🔌 **API REST Complète**

### CRUD Tags

| Méthode  | Endpoint      | Description            | Auth | Body/Params      |
| -------- | ------------- | ---------------------- | ---- | ---------------- |
| `POST`   | `/tags`       | Créer un tag           | JWT  | `CreateTagInput` |
| `GET`    | `/tags`       | Liste tous les tags    | JWT  | -                |
| `GET`    | `/tags/stats` | Tags avec statistiques | JWT  | -                |
| `GET`    | `/tags/:id`   | Détails d'un tag       | JWT  | Param `:id`      |
| `PATCH`  | `/tags/:id`   | Modifier un tag        | JWT  | `UpdateTagInput` |
| `DELETE` | `/tags/:id`   | Supprimer un tag       | JWT  | Param `:id`      |

### Filtrage des Factures par Tags

| Méthode | Endpoint                                | Description                | Paramètres           |
| ------- | --------------------------------------- | -------------------------- | -------------------- |
| `GET`   | `/invoices?tagIds=1,2,3`                | Factures filtrées          | `tagIds` (optionnel) |
| `GET`   | `/invoices/status/COMPLETED?tagIds=1,2` | Factures par statut + tags | `tagIds` (optionnel) |

## 📝 **DTOs et Validation**

### CreateTagInput

```typescript
{
  name: string;           // Requis, non vide
  description?: string;   // Optionnel
  colors?: string;        // Optionnel, défaut: "#3B82F6"
}
```

### UpdateTagInput

```typescript
{
  id: number;            // Requis
  name?: string;         // Optionnel
  description?: string;  // Optionnel
  colors?: string;       // Optionnel
}
```

## 🔍 **Exemples d'utilisation REST**

### 1. Créer un tag

```javascript
const response = await fetch("/tags", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Clients VIP",
    description: "Factures pour les clients importants",
    colors: "#10B981",
  }),
});
```

### 2. Récupérer tous les tags

```javascript
const tags = await fetch("/tags", {
  headers: { Authorization: `Bearer ${token}` },
}).then((res) => res.json());
```

### 3. Filtrer les factures par tags

```javascript
// Factures avec les tags 1, 2 et 3
const invoices = await fetch("/invoices?tagIds=1,2,3&page=1&limit=10", {
  headers: { Authorization: `Bearer ${token}` },
}).then((res) => res.json());
```

### 4. Récupérer les statistiques des tags

```javascript
const tagsWithStats = await fetch("/tags/stats", {
  headers: { Authorization: `Bearer ${token}` },
}).then((res) => res.json());

// Retourne: [{ id: 1, name: "Client", usageCount: 5 }, ...]
```

## 📊 **GraphQL Queries & Mutations**

### Queries

```graphql
# Récupérer tous les tags
query GetTags {
  tags {
    id
    name
    description
    colors
    createdAt
  }
}

# Récupérer un tag spécifique
query GetTag($id: Int!) {
  tag(id: $id) {
    id
    name
    description
    colors
  }
}

# Récupérer les tags avec statistiques
query GetTagsWithUsage {
  tagsWithUsage {
    id
    name
    description
    colors
    usageCount
  }
}

# Récupérer les factures filtrées par tags
query GetInvoicesByTags($tagIds: [Int!]) {
  invoices(tagIds: $tagIds) {
    invoices {
      id
      name
      date
      type
      status
      tags {
        id
        name
        colors
      }
    }
  }
}

# Récupérer les factures par statut et tags
query GetInvoicesByStatusAndTags($status: String!, $tagIds: [Int!]) {
  invoicesByStatus(status: $status, tagIds: $tagIds) {
    id
    name
    date
    type
    status
    tags {
      id
      name
      colors
    }
  }
}
```

### Mutations

```graphql
# Créer un tag
mutation CreateTag($input: CreateTagInput!) {
  createTag(createTagInput: $input) {
    id
    name
    description
    colors
  }
}

# Modifier un tag
mutation UpdateTag($input: UpdateTagInput!) {
  updateTag(updateTagInput: $input) {
    id
    name
    description
    colors
  }
}

# Supprimer un tag
mutation DeleteTag($id: Int!) {
  removeTag(id: $id)
}
```

## 🎨 **Composants Frontend Suggérés**

### 1. TagManager Component

```typescript
interface TagManagerProps {
  tags: Tag[];
  onTagCreate: (tag: CreateTagInput) => void;
  onTagUpdate: (tag: UpdateTagInput) => void;
  onTagDelete: (id: number) => void;
}

const TagManager = ({ tags, onTagCreate, onTagUpdate, onTagDelete }: TagManagerProps) => {
  return (
    <div className="space-y-4">
      <TagForm onSubmit={onTagCreate} />
      <TagList
        tags={tags}
        onEdit={onTagUpdate}
        onDelete={onTagDelete}
      />
    </div>
  );
};
```

### 2. TagSelector Component (pour les factures)

```typescript
interface TagSelectorProps {
  availableTags: Tag[];
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
}

const TagSelector = ({ availableTags, selectedTagIds, onChange }: TagSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {availableTags.map(tag => (
        <TagChip
          key={tag.id}
          tag={tag}
          selected={selectedTagIds.includes(tag.id)}
          onToggle={() => {
            const newSelected = selectedTagIds.includes(tag.id)
              ? selectedTagIds.filter(id => id !== tag.id)
              : [...selectedTagIds, tag.id];
            onChange(newSelected);
          }}
        />
      ))}
    </div>
  );
};
```

### 3. TagChip Component

```typescript
interface TagChipProps {
  tag: Tag;
  selected?: boolean;
  onToggle?: () => void;
  removable?: boolean;
  onRemove?: () => void;
}

const TagChip = ({ tag, selected, onToggle, removable, onRemove }: TagChipProps) => {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer
        ${selected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
      `}
      style={{ backgroundColor: selected ? tag.colors + '20' : undefined }}
      onClick={onToggle}
    >
      <span
        className="w-2 h-2 rounded-full mr-2"
        style={{ backgroundColor: tag.colors }}
      />
      {tag.name}
      {removable && (
        <button onClick={onRemove} className="ml-2 hover:text-red-600">
          ×
        </button>
      )}
    </span>
  );
};
```

### 4. TagFilter Component

```typescript
interface TagFilterProps {
  availableTags: Tag[];
  selectedTagIds: number[];
  onFilterChange: (tagIds: number[]) => void;
}

const TagFilter = ({ availableTags, selectedTagIds, onFilterChange }: TagFilterProps) => {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        Filtrer par tags
      </h3>
      <div className="flex flex-wrap gap-2">
        <TagChip
          tag={{ id: 0, name: 'Tous', colors: '#6B7280' } as Tag}
          selected={selectedTagIds.length === 0}
          onToggle={() => onFilterChange([])}
        />
        {availableTags.map(tag => (
          <TagChip
            key={tag.id}
            tag={tag}
            selected={selectedTagIds.includes(tag.id)}
            onToggle={() => {
              const newSelected = selectedTagIds.includes(tag.id)
                ? selectedTagIds.filter(id => id !== tag.id)
                : [...selectedTagIds, tag.id];
              onFilterChange(newSelected);
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

## 🎯 **Hooks React Suggérés**

### useTags Hook

```typescript
const useTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => api.getTags(),
  });
};

const useTagsWithStats = () => {
  return useQuery({
    queryKey: ["tags-stats"],
    queryFn: () => api.getTagsStats(),
  });
};
```

### useTagMutations Hook

```typescript
const useTagMutations = () => {
  const queryClient = useQueryClient();

  const createTag = useMutation({
    mutationFn: (data: CreateTagInput) => api.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const updateTag = useMutation({
    mutationFn: (data: UpdateTagInput) => api.updateTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const deleteTag = useMutation({
    mutationFn: (id: number) => api.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  return { createTag, updateTag, deleteTag };
};
```

### useInvoicesWithTagFilter Hook

```typescript
const useInvoicesWithTagFilter = (page = 1, limit = 10, tagIds?: number[]) => {
  return useQuery({
    queryKey: ["invoices", page, limit, tagIds],
    queryFn: () => api.getInvoices({ page, limit, tagIds }),
    keepPreviousData: true,
  });
};
```

## 🎨 **Structure de Pages Suggérée**

### 1. Page de Gestion des Tags (/tags)

```typescript
export default function TagsPage() {
  const { data: tags } = useTags();
  const { data: tagsWithStats } = useTagsWithStats();
  const { createTag, updateTag, deleteTag } = useTagMutations();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Gestion des Tags</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulaire de création */}
        <Card>
          <CardHeader>
            <CardTitle>Créer un nouveau tag</CardTitle>
          </CardHeader>
          <CardContent>
            <TagForm onSubmit={createTag.mutate} />
          </CardContent>
        </Card>

        {/* Liste des tags avec statistiques */}
        <Card>
          <CardHeader>
            <CardTitle>Tags existants</CardTitle>
          </CardHeader>
          <CardContent>
            <TagList
              tags={tagsWithStats}
              onEdit={updateTag.mutate}
              onDelete={deleteTag.mutate}
              showStats
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### 2. Page de Factures avec Filtrage (/invoices)

```typescript
export default function InvoicesPage() {
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);

  const { data: tags } = useTags();
  const { data: invoices } = useInvoicesWithTagFilter(page, 10, selectedTagIds);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Factures</h1>

      {/* Filtres par tags */}
      <TagFilter
        availableTags={tags}
        selectedTagIds={selectedTagIds}
        onFilterChange={setSelectedTagIds}
      />

      {/* Liste des factures */}
      <InvoiceList invoices={invoices?.invoices} />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={invoices?.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
```

## 🛠️ **Configuration API Client**

### api.ts mise à jour

```typescript
class ApiClient {
  // Tags
  async getTags(): Promise<Tag[]> {
    return this.get("/tags");
  }

  async getTagsStats(): Promise<TagWithUsage[]> {
    return this.get("/tags/stats");
  }

  async createTag(data: CreateTagInput): Promise<Tag> {
    return this.post("/tags", data);
  }

  async updateTag(data: UpdateTagInput): Promise<Tag> {
    return this.patch(`/tags/${data.id}`, data);
  }

  async deleteTag(id: number): Promise<void> {
    return this.delete(`/tags/${id}`);
  }

  // Factures avec filtrage par tags
  async getInvoices(params: {
    page?: number;
    limit?: number;
    tagIds?: number[];
  }): Promise<PaginatedInvoiceResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.tagIds?.length)
      searchParams.set("tagIds", params.tagIds.join(","));

    return this.get(`/invoices?${searchParams}`);
  }
}
```

## 🎨 **Couleurs Prédéfinies Suggérées**

```typescript
const TAG_COLORS = [
  { name: "Bleu", value: "#3B82F6" },
  { name: "Vert", value: "#10B981" },
  { name: "Rouge", value: "#EF4444" },
  { name: "Jaune", value: "#F59E0B" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Rose", value: "#EC4899" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Gris", value: "#6B7280" },
];
```

## 📊 **Exemples de Données**

### Tag Example

```typescript
const exampleTag: Tag = {
  id: 1,
  name: "Clients VIP",
  description: "Factures pour les clients les plus importants",
  colors: "#10B981",
  createdAt: "2025-06-17T10:00:00Z",
  userId: 123,
};
```

### Facture avec Tags

```typescript
const exampleInvoiceWithTags: Invoice = {
  id: 456,
  name: "Facture Client ABC",
  date: "2025-06-15T00:00:00Z",
  type: "EMIS",
  status: "COMPLETED",
  tags: [
    { id: 1, name: "Clients VIP", colors: "#10B981" },
    { id: 2, name: "Urgent", colors: "#EF4444" },
  ],
  // ...autres propriétés
};
```

## 🚀 **Avantages de cette Implémentation**

✅ **CRUD complet** - Gestion complète des tags  
✅ **Filtrage avancé** - Filtrer les factures par tags  
✅ **Statistiques** - Voir l'utilisation de chaque tag  
✅ **REST + GraphQL** - Support des deux APIs  
✅ **TypeScript** - Types complets pour tout  
✅ **Performance** - Queries optimisées avec Prisma  
✅ **UX/UI** - Composants réutilisables suggérés

Cette fonctionnalité de tags est maintenant **complètement implémentée** et prête à être utilisée ! 🎯🏷️
