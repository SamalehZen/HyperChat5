# 🎯 **Configuration Google Vision API - Guide étape par étape**

## ✅ **Étapes complétées**
- [x] Configuration Google Cloud ✅
- [x] API Key obtenue ✅ 
- [x] Code OCR implémenté ✅

## 🔧 **Prochaine étape : Configuration locale**

### **1. Créer le fichier .env.local**

Dans le dossier `/apps/web/`, crée un fichier `.env.local` :

```bash
cd /project/workspace/SamalehZen/HyperChat5/apps/web
touch .env.local
```

### **2. Ajouter ton API Key**

Ouvre `.env.local` et ajoute :

```bash
# Google Vision API Configuration
GOOGLE_VISION_API_KEY=ton_api_key_ici
VISION_API_ENABLED=true
VISION_MONTHLY_QUOTA=1000

# OCR Settings  
OCR_FALLBACK_ENABLED=true
OCR_MAX_FILE_SIZE=10485760
```

**⚠️ Remplace `ton_api_key_ici` par ton vrai API key !**

### **3. Redémarrer l'application**

```bash
bun run dev
```

## 🎯 **Test de fonctionnement**

### **Upload d'un PDF dans "Smart PDF to Excel"**
1. Va sur ton application
2. Sélectionne le mode **"Smart PDF to Excel"**
3. Upload un PDF
4. ➡️ Le système va automatiquement :
   - Utiliser Google Vision API (si quota OK)
   - Extraire le texte du PDF  
   - Envoyer le texte à l'IA
   - Fallback vers Tesseract si problème

### **Vérifier les logs**
Dans la console développeur, tu verras :
```
[OCR] Processing PDF with OCR: document.pdf
[OCR] Using strategy: google-vision for document.pdf  
[OCR] OCR completed: document.pdf | Method: google-vision | Confidence: 95%
```

## 📊 **Monitoring du quota**

### **Voir l'usage actuel**
Le système track automatiquement ton usage mensuel.

### **Quota warnings**
- 🟡 **80% utilisé** : Warning dans les logs
- 🔴 **95% utilisé** : Bascule automatiquement sur Tesseract
- ♻️ **1er du mois** : Reset automatique à 1,000 requêtes

## 🔍 **Debug si problème**

### **Si l'OCR ne fonctionne pas :**

1. **Vérifier l'API key**
```bash
echo $GOOGLE_VISION_API_KEY  # Doit afficher ton key
```

2. **Vérifier les logs**
```bash
# Dans la console du navigateur
# Tu dois voir: "Processing PDF with OCR: ..."
```

3. **Forcer Tesseract uniquement**
```bash
# Dans .env.local, temporairement :
VISION_API_ENABLED=false
```

## ⚡ **Performance attendue**

| Service | PDF 1-page | PDF 10-pages | Qualité |
|---------|------------|--------------|---------|
| **Google Vision** | ~2-5s | ~15-30s | 95-99% |
| **Tesseract** | ~5-10s | ~50-100s | 85-95% |

## 🎉 **C'est prêt !**

Ton système OCR intelligent est maintenant configuré avec :
- ✅ Google Vision API (1,000 gratuit/mois)
- ✅ Fallback automatique vers Tesseract
- ✅ Monitoring quota en temps réel
- ✅ Support PDF + Images
- ✅ Upload multiple

**Il ne reste plus qu'à ajouter ton API key dans `.env.local` !**