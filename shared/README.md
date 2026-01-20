# Architecture Shared - Documentation

Cette documentation décrit la nouvelle architecture mise en place pour améliorer la structure, la maintenabilité et la scalabilité du projet.

## 📁 Structure des dossiers

```
shared/
├── constants/          # Constantes partagées (rôles, statuts, etc.)
├── types/              # Types TypeScript réutilisables
├── dto/                # Data Transfer Objects (validation Zod)
├── errors/             # Gestion d'erreurs centralisée
├── repositories/       # Accès aux données (Data Access Layer)
└── services/           # Logique métier (Business Logic Layer)
```

## 🏗️ Architecture en couches

### 1. **Constants** (`shared/constants/`)
Centralise toutes les valeurs constantes pour éviter les "magic strings" :
- Rôles utilisateurs (`USER_ROLES`)
- Statuts de feedback (`FEEDBACK_STATUS`)
- Catégories et difficultés de quiz
- Messages d'erreur standardisés
- Codes HTTP

### 2. **Types** (`shared/types/`)
Définit les types TypeScript réutilisables dans toute l'application :
- Types de base (User, Quiz, Question, etc.)
- Types pour les réponses paginées
- Types pour les filtres et requêtes

### 3. **DTOs** (`shared/dto/`)
Data Transfer Objects avec validation Zod :
- `CreateQuizDto`, `UpdateQuizDto`
- `SubmitQuizDto`
- `UpdateProfileDto`
- `CreateFeedbackDto`
- etc.

### 4. **Errors** (`shared/errors/`)
Gestion d'erreurs centralisée :

#### `AppError`
Classe d'erreur personnalisée avec :
- Codes d'erreur typés
- Status HTTP appropriés
- Détails optionnels
- Factory methods pour erreurs communes

#### `errorHandler`
- `handleApiError()` : Gère toutes les erreurs et retourne des réponses standardisées
- `withErrorHandler()` : Wrapper pour handlers API
- `requireAuth()` : Vérifie l'authentification
- `requireAdmin()` : Vérifie les droits admin

### 5. **Repositories** (`shared/repositories/`)
Couche d'accès aux données (Data Access Layer) :
- `QuizRepository` : Opérations CRUD sur les quiz
- `QuizAttemptRepository` : Gestion des tentatives de quiz

**Avantages :**
- Sépare la logique d'accès aux données de la logique métier
- Facilite les tests unitaires
- Permet de changer facilement de base de données

### 6. **Services** (`shared/services/`)
Couche de logique métier (Business Logic Layer) :
- `QuizService` : Logique métier des quiz
- `UserService` : Gestion des utilisateurs
- `AnalyticsService` : Statistiques et analytics

**Avantages :**
- Logique métier centralisée et réutilisable
- Facilite les tests
- Respect du principe de responsabilité unique

## 🔄 Flux de données

```
API Route → Service → Repository → Database
           ↓
         DTO Validation
           ↓
         Error Handling
```

### Exemple concret :

```typescript
// 1. Route API (app/api/quizzes/[id]/route.ts)
async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quizId = quizService.validateQuizId(id)  // Validation
  const quiz = await quizService.getQuizWithQuestions(quizId)  // Service
  return NextResponse.json(quiz)
}

// 2. Service (shared/services/QuizService.ts)
async getQuizWithQuestions(id: number): Promise<Quiz> {
  const quiz = await quizRepository.findByIdWithQuestions(id, false)  // Repository
  if (!quiz) {
    throw AppError.notFound("Quiz")  // Gestion d'erreur
  }
  return quiz
}

// 3. Repository (shared/repositories/QuizRepository.ts)
async findByIdWithQuestions(id: number): Promise<QuizWithQuestions | null> {
  return prisma.quiz.findUnique({  // Accès DB
    where: { id },
    include: { questions: true }
  })
}
```

## ✅ Avantages de cette architecture

1. **Séparation des responsabilités** : Chaque couche a un rôle clair
2. **Réutilisabilité** : Services et repositories réutilisables
3. **Testabilité** : Facile à tester unitairement
4. **Maintenabilité** : Code organisé et structuré
5. **Scalabilité** : Facile d'ajouter de nouvelles features
6. **Type Safety** : TypeScript strict avec validation Zod
7. **Gestion d'erreurs** : Centralisée et standardisée

## 🚀 Utilisation

### Dans une route API :

```typescript
import { withErrorHandler, requireAuth } from "@/shared/errors/errorHandler"
import { quizService } from "@/shared/services/QuizService"
import { QuizQueryDto } from "@/shared/dto"

async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = QuizQueryDto.parse({
    page: searchParams.get("page"),
    // ...
  })
  
  const result = await quizService.getQuizzes(query)
  return NextResponse.json(result)
}

export const GET_handler = withErrorHandler(GET)
export { GET_handler as GET }
```

### Créer un nouveau service :

1. Créer le repository si nécessaire (`shared/repositories/`)
2. Créer le service (`shared/services/`)
3. Utiliser dans les routes API

## 📝 Bonnes pratiques

1. **Toujours utiliser les DTOs** pour valider les entrées
2. **Utiliser les services** pour la logique métier
3. **Utiliser les repositories** pour l'accès aux données
4. **Gérer les erreurs** avec `AppError` et `withErrorHandler`
5. **Utiliser les constantes** au lieu de strings magiques
6. **Typer tout** avec TypeScript

## 🔧 Migration progressive

Les routes API existantes sont migrées progressivement vers cette nouvelle architecture. Les routes non migrées continuent de fonctionner normalement.

## 📚 Ressources

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
