# 🔐 Guide Étape par Étape - Policies RLS & Realtime

## 📋 Étape 4 : Configurer les Policies RLS

### 🗂️ Bucket `memes`

#### Policy 1 : Lecture publique (SELECT)

1. **Allez sur** : Dashboard Supabase → **Storage** → **Policies**
2. **Sélectionnez le bucket** : `memes`
3. **Cliquez sur** : **"New Policy"** (en haut à droite)
4. **Choisissez** : **"For full customization"** (en bas)
5. **Remplissez** :
   - **Policy name** : `Allow public read access`
   - **Allowed operation** : Sélectionnez **`SELECT`**
   - **Policy definition** : Copiez-collez exactement ceci :
     (bucket_id = 'memes'::text)
     ```sql
     ```
6. **Cliquez sur** : **"Review"** puis **"Save policy"**

#### Policy 2 : Upload authentifié (INSERT)

1. **Toujours dans le bucket `memes`**, cliquez sur **"New Policy"**
2. **Choisissez** : **"For full customization"**
3. **Remplissez** :
   - **Policy name** : `Allow authenticated upload`
   - **Allowed operation** : Sélectionnez **`INSERT`**
   - **Policy definition** : Copiez-collez exactement ceci :
     ```sql
     (bucket_id = 'memes'::text AND auth.role() = 'authenticated'::text)
     ```
4. **Cliquez sur** : **"Review"** puis **"Save policy"**

#### Policy 3 : Suppression par propriétaire (DELETE)

1. **Toujours dans le bucket `memes`**, cliquez sur **"New Policy"**
2. **Choisissez** : **"For full customization"**
3. **Remplissez** :
   - **Policy name** : `Allow owner delete`
   - **Allowed operation** : Sélectionnez **`DELETE`**
   - **Policy definition** : Copiez-collez exactement ceci :
     ```sql
     (bucket_id = 'memes'::text AND auth.uid()::text = (storage.foldername(name))[1])
     ```
4. **Cliquez sur** : **"Review"** puis **"Save policy"**

---

### 🗂️ Bucket `avatars`

**Répétez exactement les mêmes 3 policies pour le bucket `avatars`** :

#### Policy 1 : Lecture publique (SELECT)
- **Policy name** : `Allow public read access`
- **Allowed operation** : `SELECT`
- **Policy definition** :
  ```sql
  (bucket_id = 'avatars'::text)
  ```

#### Policy 2 : Upload authentifié (INSERT)
- **Policy name** : `Allow authenticated upload`
- **Allowed operation** : `INSERT`
- **Policy definition** :
  ```sql
  (bucket_id = 'avatars'::text AND auth.role() = 'authenticated'::text)
  ```

#### Policy 3 : Suppression par propriétaire (DELETE)
- **Policy name** : `Allow owner delete`
- **Allowed operation** : `DELETE`
- **Policy definition** :
  ```sql
  (bucket_id = 'avatars'::text AND auth.uid()::text = (storage.foldername(name))[1])
  ```

---

## ✅ Vérification des Policies

Après avoir créé toutes les policies, vous devriez avoir :

**Bucket `memes`** :
- ✅ `Allow public read access` (SELECT)
- ✅ `Allow authenticated upload` (INSERT)
- ✅ `Allow owner delete` (DELETE)

**Bucket `avatars`** :
- ✅ `Allow public read access` (SELECT)
- ✅ `Allow authenticated upload` (INSERT)
- ✅ `Allow owner delete` (DELETE)

**Total : 6 policies** (3 par bucket)

---

## 📡 Étape 5 : Activer Realtime

### Méthode 1 : Via l'Interface (Recommandé)

1. **Allez sur** : Dashboard Supabase → **Database** → **Replication**
2. **Vous verrez une liste de toutes vos tables**
3. **Pour chaque table ci-dessous, cliquez sur le toggle à droite** pour activer Realtime :

#### Tables à activer (7 au total) :

1. ✅ **`memes`** - Cliquez sur le toggle (devient vert/actif)
2. ✅ **`votes`** - Cliquez sur le toggle
3. ✅ **`profiles`** - Cliquez sur le toggle
4. ✅ **`battles`** - Cliquez sur le toggle
5. ✅ **`direct_messages`** - Cliquez sur le toggle (c'est la table réelle, pas "messages")
6. ✅ **`leaderboard`** - Cliquez sur le toggle (cette table couvre daily/weekly/global via le champ `period_type`)

**⚠️ Note importante :**
- La table s'appelle **`direct_messages`** (pas `messages`) - utilisez celle-ci pour Realtime
- Les tables `leaderboard_daily`, `leaderboard_weekly`, `leaderboard_global` n'existent pas en tant que tables séparées
- La table **`leaderboard`** contient un champ `period_type` qui peut être 'daily', 'weekly', ou 'global'
- Pour filtrer côté client, utilisez : `period_type = 'daily'` pour daily, etc.

---

### Méthode 2 : Via SQL (Alternative)

Si vous préférez utiliser SQL :

1. **Allez sur** : Dashboard → **SQL Editor**
2. **Créez une nouvelle query**
3. **Copiez-collez ce code** :

```sql
-- Activer Realtime pour toutes les tables nécessaires
ALTER PUBLICATION supabase_realtime ADD TABLE memes;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE battles;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;
```

4. **Cliquez sur** : **"Run"** (ou `Ctrl+Enter`)

---

## ✅ Vérification Realtime

1. **Allez sur** : **Database** → **Replication**
2. **Vérifiez** que toutes les tables listées ci-dessus ont un **toggle vert/actif**
3. **Si une table n'est pas activée**, cliquez sur son toggle

---

## 🎯 Checklist Finale

### Policies RLS
- [ ] Policy SELECT créée pour `memes`
- [ ] Policy INSERT créée pour `memes`
- [ ] Policy DELETE créée pour `memes`
- [ ] Policy SELECT créée pour `avatars`
- [ ] Policy INSERT créée pour `avatars`
- [ ] Policy DELETE créée pour `avatars`

### Realtime
- [ ] `memes` activé
- [ ] `votes` activé
- [ ] `profiles` activé
- [ ] `battles` activé
- [ ] `messages` activé
- [ ] `leaderboard_daily` activé
- [ ] `leaderboard_weekly` activé
- [ ] `leaderboard_global` activé

---

## 🆘 Problèmes Courants

### "Table not found" dans Realtime
- **Solution** : Vérifiez que toutes les migrations SQL ont été exécutées
- Allez dans **Table Editor** et vérifiez que les tables existent

### "Policy creation failed"
- **Solution** : Vérifiez que vous avez bien copié-collé le code SQL exactement
- Assurez-vous que les guillemets sont droits (`'`) et non courbes (`'`)

### "Realtime toggle not working"
- **Solution** : Utilisez la méthode SQL (Méthode 2) à la place

---

**Une fois terminé, vous pouvez passer à l'étape suivante ! 🚀**

