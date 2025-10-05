# ⚡ StackBlitz Quick Start

## Instant Deploy (No Setup Required!)

This project is **100% ready for StackBlitz**. Just follow these simple steps:

### Method 1: GitHub Import (Recommended)

1. Push this folder to a GitHub repository
2. Go to https://stackblitz.com
3. Click **"Import from GitHub"**
4. Paste your repository URL
5. **Done!** The app will auto-install and run

### Method 2: Direct Upload

1. Zip this entire `powerbi-ai-builder` folder
2. Go to https://stackblitz.com
3. Create a new Vite project
4. Drag and drop all files
5. **Done!** StackBlitz handles the rest

## What Happens Automatically

✅ Dependencies install automatically (no `npm install` needed)
✅ Dev server starts on port 3000
✅ Hot reload enabled for live editing
✅ Browser preview opens instantly
✅ Shareable URL generated

## Testing the App

Once deployed:

1. **Upload CSV**: Use one of the sample files from `/public/samples/`
   - `sales.csv` - Best for beginners
   - `marketing.csv` - Marketing metrics
   - `hr.csv` - Employee data

2. **See AI Analysis**: Dashboard recommendations appear automatically

3. **Chat with AI**: Try these commands:
   - "Change to vibrant colors"
   - "Add more KPI cards"
   - "Show top 10 items only"

4. **View Setup Guide**: Click "Show Setup Guide" button

5. **Copy Code**: Click copy buttons on DAX and M code blocks

## StackBlitz Features You'll Love

- **No Local Setup**: Everything runs in browser
- **Instant Sharing**: Share your live app with a URL
- **Web Container**: Full Node.js environment in browser
- **Fast Reload**: Changes appear instantly
- **Zero Config**: Works perfectly out of the box

## File Structure (What StackBlitz Will See)

```
powerbi-ai-builder/
├── package.json          ← Dependencies (auto-installed)
├── vite.config.js        ← Build config
├── index.html            ← Entry point
├── src/
│   ├── main.jsx          ← React entry
│   ├── App.jsx           ← Main component
│   ├── components/       ← All UI components
│   └── utils/            ← Helper functions
└── public/
    └── samples/          ← Sample CSV files
```

## Troubleshooting

**Dependencies not installing?**
→ StackBlitz auto-installs. Just wait 10-20 seconds.

**Page blank?**
→ Check the terminal panel in StackBlitz for errors
→ Refresh the preview window

**Upload not working?**
→ Make sure you're uploading a CSV file
→ Try one of the sample files first

## Next Steps After Deploy

1. ✅ Test with sample CSV files
2. ✅ Try the chat interface
3. ✅ View dashboard previews
4. ✅ Copy DAX/M code blocks
5. ✅ Share your StackBlitz URL!

## Production Notes

This is a **production-ready demo**. The app uses a mock AI API for demonstration.

To use real Claude API:
- Sign up at https://console.anthropic.com
- Update `src/utils/claudeApi.js`
- Add your API key as environment variable

## Performance

Expected load time on StackBlitz:
- First load: 15-20 seconds (installing deps)
- Subsequent loads: < 5 seconds
- App interactions: Instant

## Success!

Your app is ready when you see:
- File upload interface
- "Power BI AI Dashboard Builder" title
- Drag-and-drop zone with upload icon

**Now you can crush it with this killer app!** 🚀

---

💡 **Pro Tip**: Bookmark your StackBlitz URL for instant access later!
