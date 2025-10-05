# 🚀 Deployment Guide for Power BI AI Dashboard Builder

## StackBlitz (Recommended - Instant Deploy)

StackBlitz is perfect for this project as it provides instant deployment with zero configuration!

### Option 1: Import from GitHub

1. Push your code to GitHub
2. Go to https://stackblitz.com
3. Click "Import from GitHub"
4. Enter your repository URL
5. Done! StackBlitz will automatically install dependencies and start the dev server

### Option 2: Direct Upload

1. Go to https://stackblitz.com
2. Click "New Project" → "Vite"
3. Drag and drop your project folder
4. The project will deploy automatically

### StackBlitz Features

- ✅ Zero configuration needed
- ✅ Hot reload out of the box
- ✅ Shareable live URLs
- ✅ Web container technology
- ✅ Works entirely in browser

## Alternative Deployment Options

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Netlify

```bash
# Build the project
npm run build

# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### GitHub Pages

```bash
# Update vite.config.js to include base
# base: '/your-repo-name/'

# Build
npm run build

# Deploy to gh-pages branch
npm i -g gh-pages
gh-pages -d dist
```

## Environment Setup

No API keys required! The app uses a mock Claude API for demo purposes.

To integrate real Claude API:

1. Sign up at https://console.anthropic.com
2. Get your API key
3. Update `src/utils/claudeApi.js` with real API calls
4. Add environment variable: `VITE_ANTHROPIC_API_KEY`

## Performance Optimization

The build output shows the app is ready for production:

- ✅ CSS optimized and minified (15.79 kB)
- ✅ JavaScript bundled (578.11 kB - includes Recharts library)
- ✅ Gzip compression enabled
- ✅ Source maps generated for debugging

### Further Optimizations

For production use, consider:

1. **Code Splitting**: Lazy load heavy components
2. **CDN**: Use Recharts from CDN
3. **Caching**: Implement service worker
4. **Image Optimization**: Compress any images

## Testing Before Deploy

```bash
# Build and preview locally
npm run build
npm run preview

# Open http://localhost:4173
```

## Troubleshooting

**Build fails?**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Update Node.js to version 18+

**StackBlitz not loading?**
- Check browser console for errors
- Try incognito mode
- Ensure no ad blockers are interfering

**Charts not rendering?**
- Verify sample CSV files are in public/samples/
- Check browser console for Recharts errors

## Success Criteria

Your deployment is successful when you can:

- [x] Upload a CSV file
- [x] See AI-generated dashboard recommendations
- [x] View interactive chart previews
- [x] Copy DAX and M code blocks
- [x] Navigate through setup guide steps

## Production Checklist

Before going live:

- [ ] Test with multiple CSV formats
- [ ] Verify all chart types render correctly
- [ ] Check mobile responsiveness
- [ ] Test copy-to-clipboard functionality
- [ ] Validate DAX code syntax
- [ ] Test with large files (10MB)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Lighthouse audit (aim for 90+ scores)

## Support

Need help? Check:
- README.md for usage instructions
- GitHub Issues for known problems
- StackBlitz Console for deployment logs

---

**Ready to deploy!** This app is optimized for StackBlitz and will work out of the box. 🎉
