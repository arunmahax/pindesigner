# 🎯 QUICK EDIT GUIDE - Dual Image Pin Styles

## 📍 **WHERE TO EDIT FOR DUAL IMAGE PINS**

Since your `defaultTheme` is set to `"food"`, edit the **FOOD THEME** section (around line 50):

```json
"food": {
  "fontSize": 60,              ← CHANGE THIS NUMBER (20-120)
  "fontFamily": "Arial",       ← CHANGE THIS TEXT
  "textColor": "#FFFFFF",      ← CHANGE THIS COLOR
  "strokeColor": "#000000",    ← CHANGE OUTLINE COLOR  
  "strokeWidth": 4,            ← CHANGE OUTLINE THICKNESS (0-10)
  "backgroundColor": "rgba(255, 0, 0, 0.8)",  ← CHANGE BACKGROUND
  "fontWeight": "bold"         ← CHANGE TO: "bold" or "normal"
}
```

## 🎨 **EASY EXAMPLES TO COPY & PASTE**

### **Big Red Text:**
```json
"food": {
  "fontSize": 70,
  "fontFamily": "Impact",
  "textColor": "#FF0000",
  "strokeColor": "#FFFFFF",
  "strokeWidth": 3,
  "backgroundColor": "rgba(0, 0, 0, 0.8)",
  "fontWeight": "bold"
}
```

### **Gold Elegant Text:**
```json
"food": {
  "fontSize": 55,
  "fontFamily": "Georgia",
  "textColor": "#FFD700",
  "strokeColor": "#000000",
  "strokeWidth": 2,
  "backgroundColor": "rgba(0, 0, 0, 0.7)",
  "fontWeight": "normal"
}
```

### **Blue Modern Text:**
```json
"food": {
  "fontSize": 48,
  "fontFamily": "Helvetica",
  "textColor": "#00BFFF",
  "strokeColor": "#FFFFFF",
  "strokeWidth": 2,
  "backgroundColor": "rgba(0, 0, 0, 0.6)",
  "fontWeight": "bold"
}
```

## 🔧 **STEP-BY-STEP PROCESS**

1. **Open:** `pinterest-styles.json`
2. **Find:** The `"food"` section (around line 50)
3. **Edit:** Any values you want to change
4. **Save:** The file (Ctrl+S)
5. **Restart:** Your services (double-click `start-both-services.bat`)
6. **Test:** Create a new dual image pin

## 🎯 **QUICK COLOR CODES**

### Text Colors:
- **White:** `"#FFFFFF"`
- **Black:** `"#000000"`
- **Red:** `"#FF0000"`
- **Blue:** `"#0066FF"`
- **Green:** `"#00FF00"`
- **Gold:** `"#FFD700"`
- **Purple:** `"#9966CC"`

### Background Colors:
- **Black 80%:** `"rgba(0, 0, 0, 0.8)"`
- **Red 70%:** `"rgba(255, 0, 0, 0.7)"`
- **Blue 60%:** `"rgba(0, 100, 200, 0.6)"`
- **White 90%:** `"rgba(255, 255, 255, 0.9)"`

### Fonts:
- **Arial** - Clean
- **Impact** - Bold
- **Georgia** - Elegant
- **Helvetica** - Modern

## ⚡ **INSTANT TEST**

After editing:
1. Save the file
2. Go to: http://localhost:3000
3. Upload two images
4. See your changes immediately!

**The changes apply to ALL new dual image pins created!** 🚀
