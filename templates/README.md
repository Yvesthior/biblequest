# Template pour Bulk Upload des Questions de Quiz

## Fichier Template
- **Fichier** : `quiz_questions_template.csv`
- **Format** : CSV (peut être ouvert dans Excel, Google Sheets, etc.)

## Instructions d'utilisation

### 1. Ouvrir le template
- Ouvrez le fichier `quiz_questions_template.csv` dans Excel ou votre éditeur de tableur préféré
- Le fichier contient déjà des exemples de données que vous pouvez remplacer

### 2. Colonnes du template

| Colonne | Description | Obligatoire | Exemple |
|---------|-------------|-------------|---------|
| `quiz_title` | Titre du quiz | ✅ | "Quiz sur les Paraboles" |
| `quiz_description` | Description du quiz | ❌ | "Testez vos connaissances sur les paraboles de Jésus" |
| `quiz_category` | Catégorie du quiz | ❌ | "Nouveau Testament", "Ancien Testament", "Général" |
| `quiz_difficulty` | Niveau de difficulté | ❌ | "Facile", "Moyen", "Difficile" |
| `question_text` | Texte de la question | ✅ | "Quelle est la parabole du semeur ?" |
| `option_1` | Première option de réponse | ✅ | "Le semeur sème la parole de Dieu" |
| `option_2` | Deuxième option de réponse | ✅ | "Le semeur plante des graines dans son jardin" |
| `option_3` | Troisième option de réponse | ❌ | "Le semeur raconte une histoire" |
| `option_4` | Quatrième option de réponse | ❌ | "Le semeur enseigne aux disciples" |
| `correct_option_index` | Index de la bonne réponse (1-4) | ✅ | 1, 2, 3, ou 4 |
| `explanation` | Explication de la réponse | ❌ | "La parabole du semeur illustre..." |
| `reference` | Référence biblique | ❌ | "Matthieu 13:3-9" |

### 3. Règles importantes

#### Pour les options de réponse :
- **Minimum** : 2 options (option_1 et option_2)
- **Maximum** : 4 options (option_1 à option_4)
- Si vous n'utilisez que 2 ou 3 options, laissez les colonnes vides

#### Pour l'index de la bonne réponse :
- Utilisez 1, 2, 3, ou 4 selon la position de la bonne réponse
- 1 = option_1, 2 = option_2, etc.

#### Pour les quiz :
- Si plusieurs questions appartiennent au même quiz, utilisez le même `quiz_title`, `quiz_description`, `quiz_category`, et `quiz_difficulty`
- Chaque ligne représente une question

### 4. Exemple de données

```csv
quiz_title,quiz_description,quiz_category,quiz_difficulty,question_text,option_1,option_2,option_3,option_4,correct_option_index,explanation,reference
"Quiz sur les Paraboles","Testez vos connaissances sur les paraboles de Jésus","Nouveau Testament","Moyen","Quelle est la parabole du semeur ?","Le semeur sème la parole de Dieu","Le semeur plante des graines dans son jardin","Le semeur raconte une histoire","Le semeur enseigne aux disciples",1,"La parabole du semeur illustre comment la parole de Dieu est reçue différemment selon les cœurs des auditeurs.","Matthieu 13:3-9"
```

### 5. Après avoir rempli le template

1. Sauvegardez le fichier en format CSV
2. Utilisez ce fichier pour votre bulk upload
3. Le système créera automatiquement les quiz et les questions selon vos données

## Notes techniques

- Le fichier utilise l'encodage UTF-8 pour supporter les caractères spéciaux
- Les guillemets sont utilisés pour encapsuler les valeurs contenant des virgules
- Les champs optionnels peuvent être laissés vides
