# 🚀 Power BI AI Dashboard Builder

**Upload your CSV data and let AI design your perfect Power BI dashboard with copy-paste ready DAX and M code!**

[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18+-61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)

## ✨ Features

- **🤖 AI-Powered Analysis**: Upload CSV and get instant dashboard recommendations
- **💬 Conversational Refinement**: Chat with AI to customize your dashboard design
- **📊 Live Preview**: See your dashboard design with interactive charts
- **📋 Copy-Paste Ready Code**: Get DAX measures and Power Query M code instantly
- **📖 Step-by-Step Guide**: Detailed instructions for building in Power BI Desktop
- **🎨 Beautiful UI**: Modern, responsive design with smooth animations
- **⚡ Lightning Fast**: Built with Vite for optimal performance

## 🎯 What You Get

1. **Dashboard Specification** - AI-generated layout with recommended visuals
2. **DAX Measures** - Pre-written formulas for calculations
3. **Power Query M Code** - Data import and transformation scripts
4. **Setup Guide** - Complete walkthrough with screenshots
5. **Export Options** - Download specs and code for later use

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd powerbi-ai-builder

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

## 📖 How to Use

### 1. Upload Your Data
- Drag and drop a CSV file or click to browse
- Maximum file size: 10MB
- Supported format: .csv

### 2. Get AI Recommendations
- AI automatically analyzes your data structure
- Recommends optimal chart types and layouts
- Suggests KPIs and metrics

### 3. Refine with Chat
- Ask AI to modify colors, add charts, or change layouts
- Use quick action buttons for common requests
- Natural language commands work great!

### 4. Review Dashboard Preview
- See live charts with your actual data
- Interactive tooltips and legends
- Responsive design for all screen sizes

### 5. Get Setup Code
- Click "Show Setup Guide"
- Copy DAX measures and M code
- Follow step-by-step instructions
- Mark steps complete as you go

### 6. Build in Power BI
- Open Power BI Desktop
- Import data using provided M code
- Create measures from DAX code
- Add visuals following the guide

## 🎨 Sample Data

Three sample CSV files are included in `/public/samples/`:

- **sales.csv** - Sales data with dates, products, regions
- **marketing.csv** - Campaign performance metrics
- **hr.csv** - Employee data and performance

## 🏗️ Project Structure

```
powerbi-ai-builder/
├── public/
│   └── samples/          # Sample CSV files
├── src/
│   ├── components/       # React components
│   │   ├── FileUpload.jsx
│   │   ├── ChatInterface.jsx
│   │   ├── DashboardPreview.jsx
│   │   ├── SetupGuide.jsx
│   │   ├── CodeBlock.jsx
│   │   └── QuickActions.jsx
│   ├── utils/           # Utility functions
│   │   ├── csvParser.js
│   │   ├── claudeApi.js
│   │   ├── daxGenerator.js
│   │   └── colorPalettes.js
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **Charts**: Recharts 2
- **Icons**: Lucide React
- **Language**: JavaScript (ES6+)

## 🎯 Key Components

### FileUpload
Drag-and-drop interface with file validation, CSV parsing, and error handling.

### ChatInterface
Conversational UI for refining dashboard designs with message history and typing indicators.

### DashboardPreview
Live preview of dashboard with interactive charts (line, bar, pie, card, table).

### SetupGuide
Collapsible step-by-step instructions with copy-paste code blocks.

### CodeBlock
Syntax-highlighted code display with one-click copy functionality.

## 📝 Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

## 🚀 Deployment

### StackBlitz

1. Open StackBlitz
2. Click "Import from GitHub"
3. Paste your repository URL
4. The app will auto-deploy!

### Vercel

```bash
npm run build
npx vercel --prod
```

### Netlify

```bash
npm run build
npx netlify deploy --prod --dir=dist
```

## 🎨 Customization

### Color Palettes

Edit `src/utils/colorPalettes.js` to add custom color schemes:

```javascript
export const colorPalettes = {
  myBrand: {
    name: 'My Brand',
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1']
  }
};
```

### Dashboard Templates

Modify `src/utils/claudeApi.js` to add pre-built dashboard templates.

## 🐛 Troubleshooting

**CSV not parsing correctly?**
- Ensure proper CSV format with headers
- Check for special characters in data
- Verify file encoding is UTF-8

**Charts not displaying?**
- Check browser console for errors
- Ensure data has numeric columns for charts
- Verify date columns are properly formatted

**Code blocks not copying?**
- Check browser clipboard permissions
- Try a different browser
- Use manual copy as fallback

## 📄 License

MIT License - feel free to use for personal or commercial projects!

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 🌟 Support

Found this helpful? Give it a star ⭐ on GitHub!

## 📧 Contact

Have questions or feedback? Open an issue on GitHub.

---

**Built with ❤️ for the Power BI community**
