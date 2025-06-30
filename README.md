# BOM Comparison Tool

A modern web application for comparing Bill of Materials (BOM) between SOLIDWORKS and DURO systems.

## Features

- 📋 **Excel File Comparison**: Compare BOMs exported from SOLIDWORKS and DURO
- 🔍 **Smart Analysis**: Automatically detects missing parts, quantity differences, and description mismatches
- 🎨 **Modern UI**: Glass morphism design with company branding
- 📖 **Interactive Tutorial**: Built-in guide for proper BOM export procedures
- 📊 **Detailed Results**: Categorized comparison results with filtering and search
- 💾 **Export Options**: Export comparison results to Excel, CSV, or PDF

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone or download this repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## How to Use

### Step 1: Export from DURO
1. Navigate to your assembly in DURO
2. Click "Export this component" (top right corner)
3. Select "One level BOM" in export settings dropdown  
4. Click "Export" to download

### Step 2: Export from SOLIDWORKS
1. Open your assembly drawing in SOLIDWORKS
2. Insert → Tables → Bill of Materials
3. Configure BOM Type to "Top-level only"
4. Right-click table → Save As → Excel (.xlsx)

### Step 3: Compare
1. Upload your SOLIDWORKS BOM file
2. Upload your DURO BOM file  
3. Click "Compare BOMs"
4. Review categorized results and export if needed

## What Gets Compared

- ✅ **Missing Parts**: Items present in one system but not the other
- ✅ **Quantity Differences**: Parts with mismatched quantities
- ✅ **Description Mismatches**: Parts with different descriptions
- ✅ **Part Number Validation**: Ensures consistency across systems

## Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom glass morphism design
- **File Processing**: Client-side Excel parsing
- **Export**: Multiple format support (Excel, CSV, PDF)

## Project Structure

```
src/
├── app/                    # Next.js app router
├── components/
│   ├── excel/             # Excel comparison components
│   └── modals/            # Modal components (tutorial)
├── models/                # TypeScript interfaces
├── services/              # Business logic
└── utils/                 # Utility functions
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Adding Features

1. Components go in `src/components/`
2. Business logic in `src/services/`
3. Type definitions in `src/models/`
4. Utility functions in `src/utils/`

## Browser Support

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary software developed for internal use.

---

**Need help?** Click the help button (?) in the top-right corner for an interactive tutorial.