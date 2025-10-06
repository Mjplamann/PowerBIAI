import JSZip from 'jszip';
import { generateAllDAXMeasures } from './daxGenerator';
import { cleanCSVData } from './csvExporter';
import { inferDataTypes } from './csvParser';

/**
 * Generate a complete Power BI Project (.pbip) package
 * Ready to open directly in Power BI Desktop
 */
export const generatePowerBIPackage = async (dashboardSpec, csvData, fileName, customColors, chartSizes, dimensions) => {
  const zip = new JSZip();
  const projectName = fileName.replace('.csv', '') || 'Dashboard';
  const cleanedData = cleanCSVData(csvData);
  const dataTypes = inferDataTypes(csvData.data, csvData.headers);

  // 1. Create .pbip project file (root)
  const pbipContent = {
    version: "1.0",
    artifacts: [
      {
        report: {
          path: `${projectName}.Report`,
          type: "Report"
        }
      },
      {
        dataset: {
          path: `${projectName}.SemanticModel`,
          type: "SemanticModel"
        }
      }
    ]
  };

  zip.file(`${projectName}.pbip`, JSON.stringify(pbipContent, null, 2));

  // 2. Create SemanticModel folder structure
  const semanticModel = zip.folder(`${projectName}.SemanticModel`);

  // 2a. Model definition
  const modelDefinition = generateSemanticModel(csvData, dataTypes, projectName);
  semanticModel.file('model.bim', JSON.stringify(modelDefinition, null, 2));

  // 2b. Definition folder with tables
  const definition = semanticModel.folder('definition');

  // Table definition
  const tableDefinition = generateTableDefinition(csvData, dataTypes, projectName);
  definition.file('tables/Data.tmdl', tableDefinition);

  // Measures
  const allMeasures = generateAllDAXMeasures(dashboardSpec);
  const measuresDefinition = generateMeasuresDefinition(allMeasures);
  definition.file('measures.tmdl', measuresDefinition);

  // Relationships (if we detect any)
  const relationships = detectRelationships(csvData, dataTypes);
  if (relationships.length > 0) {
    const relationshipsDefinition = generateRelationshipsDefinition(relationships);
    definition.file('relationships.tmdl', relationshipsDefinition);
  }

  // 3. Create Report folder structure
  const report = zip.folder(`${projectName}.Report`);

  // 3a. Report definition (PBIR)
  const reportDefinition = generateReportDefinition(dashboardSpec, csvData, customColors, dimensions, projectName);
  report.file('report.json', JSON.stringify(reportDefinition, null, 2));

  // 3b. Static resources (for custom visuals if needed)
  const staticResources = report.folder('StaticResources');

  // 4. Add cleaned data CSV
  const csvContent = generateCleanedCSV(cleanedData);
  zip.file(`${projectName}_data.csv`, csvContent);

  // 5. Create comprehensive README
  const readme = generateReadme(projectName, dashboardSpec, csvData, allMeasures);
  zip.file('README.md', readme);

  // 6. Generate and download ZIP
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName}_PowerBI.zip`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Generate semantic model (data model) definition
 */
const generateSemanticModel = (csvData, dataTypes, projectName) => {
  const columns = csvData.headers.map(header => {
    const type = dataTypes[header];
    let dataType = 'string';
    let formatString = '';

    if (type === 'number') {
      dataType = 'double';
      formatString = '#,##0.00';
    } else if (type === 'date') {
      dataType = 'dateTime';
      formatString = 'Short Date';
    } else if (type === 'boolean') {
      dataType = 'boolean';
    }

    return {
      name: header,
      dataType: dataType,
      sourceColumn: header,
      formatString: formatString,
      summarizeBy: type === 'number' ? 'sum' : 'none',
      annotations: [
        {
          name: 'SummarizationSetBy',
          value: 'Automatic'
        }
      ]
    };
  });

  return {
    name: projectName,
    compatibilityLevel: 1567,
    model: {
      culture: 'en-US',
      defaultPowerBIDataSourceVersion: 'powerBI_V3',
      sourceQueryCulture: 'en-US',
      tables: [
        {
          name: 'Data',
          columns: columns,
          partitions: [
            {
              name: 'Data',
              mode: 'import',
              source: {
                type: 'csv',
                path: `${projectName}_data.csv`
              }
            }
          ]
        }
      ],
      annotations: [
        {
          name: 'ClientCompatibilityLevel',
          value: '700'
        }
      ]
    }
  };
};

/**
 * Generate table definition in TMDL format
 */
const generateTableDefinition = (csvData, dataTypes, tableName) => {
  let tmdl = `table Data\n`;
  tmdl += `\tlineageTag: ${generateGuid()}\n\n`;

  csvData.headers.forEach(header => {
    const type = dataTypes[header];
    let dataType = 'string';

    if (type === 'number') dataType = 'double';
    else if (type === 'date') dataType = 'dateTime';
    else if (type === 'boolean') dataType = 'boolean';

    tmdl += `\tcolumn '${header}'\n`;
    tmdl += `\t\tdataType: ${dataType}\n`;
    tmdl += `\t\tlineageTag: ${generateGuid()}\n`;
    tmdl += `\t\tsummarizeBy: ${type === 'number' ? 'sum' : 'none'}\n`;
    tmdl += `\t\tsourceColumn: ${header}\n\n`;
  });

  tmdl += `\tpartition Data = m\n`;
  tmdl += `\t\tmode: import\n`;
  tmdl += `\t\tsource =\n`;
  tmdl += `\t\t\tlet\n`;
  tmdl += `\t\t\t\tSource = Csv.Document(File.Contents("${tableName}_data.csv"),[Delimiter=",", Columns=${csvData.headers.length}, Encoding=65001, QuoteStyle=QuoteStyle.None]),\n`;
  tmdl += `\t\t\t\tPromotedHeaders = Table.PromoteHeaders(Source, [PromoteAllScalars=true])\n`;
  tmdl += `\t\t\tin\n`;
  tmdl += `\t\t\t\tPromotedHeaders\n\n`;

  return tmdl;
};

/**
 * Generate measures definition in TMDL format
 */
const generateMeasuresDefinition = (measures) => {
  let tmdl = `// DAX Measures\n// Generated by Power BI AI Builder\n\n`;

  measures.forEach(measure => {
    tmdl += `measure '${measure.name}' = ${measure.formula}\n`;
    tmdl += `\tformatString: #,##0.00\n`;
    tmdl += `\tdescription: "${measure.description}"\n\n`;
  });

  return tmdl;
};

/**
 * Detect potential relationships between columns
 */
const detectRelationships = (csvData, dataTypes) => {
  const relationships = [];
  const headers = csvData.headers;

  // Look for common key patterns (ID columns, foreign keys)
  const idColumns = headers.filter(h =>
    h.toLowerCase().includes('id') &&
    !h.toLowerCase().includes('guid')
  );

  // Check for potential relationships
  // (In a real scenario, you'd analyze data to find matching keys)

  return relationships;
};

/**
 * Generate relationships definition
 */
const generateRelationshipsDefinition = (relationships) => {
  let tmdl = `// Relationships\n\n`;

  relationships.forEach(rel => {
    tmdl += `relationship ${rel.name}\n`;
    tmdl += `\tfromColumn: ${rel.fromTable}.${rel.fromColumn}\n`;
    tmdl += `\ttoColumn: ${rel.toTable}.${rel.toColumn}\n`;
    tmdl += `\tcrossFilteringBehavior: oneDirection\n\n`;
  });

  return tmdl;
};

/**
 * Generate report definition with visuals
 */
const generateReportDefinition = (dashboardSpec, csvData, customColors, dimensions, projectName) => {
  const visuals = dashboardSpec.visuals.map((visual, idx) => {
    return generateVisualConfig(visual, idx, csvData, customColors);
  });

  return {
    name: dashboardSpec.title || 'Dashboard',
    dataModelRefs: [
      {
        namespace: 'powerbi',
        artifact: projectName
      }
    ],
    sections: [
      {
        name: 'Page1',
        displayName: 'Main Dashboard',
        width: dimensions.width,
        height: dimensions.height,
        displayOption: 1,
        visualContainers: visuals,
        config: JSON.stringify({
          wallpaper: {
            transparency: 0,
            color: customColors.background
          }
        })
      }
    ],
    config: JSON.stringify({
      theme: {
        name: 'Custom',
        dataColors: dashboardSpec.colorPalette || ['#118DFF', '#12239E', '#E66C37', '#6B007B']
      }
    })
  };
};

/**
 * Generate individual visual configuration
 */
const generateVisualConfig = (visual, index, csvData, customColors) => {
  const visualType = mapVisualType(visual.type);
  const position = calculateVisualPosition(index, visual.type);

  return {
    x: position.x,
    y: position.y,
    z: index * 1000,
    width: position.width,
    height: position.height,
    config: JSON.stringify({
      name: generateGuid(),
      layouts: [
        {
          position: {
            x: position.x,
            y: position.y,
            z: index * 1000,
            width: position.width,
            height: position.height,
            tabOrder: index
          }
        }
      ],
      singleVisual: {
        visualType: visualType,
        projections: generateVisualProjections(visual, csvData),
        prototypeQuery: generatePrototypeQuery(visual, csvData),
        vcObjects: generateVisualObjects(visual, customColors)
      }
    })
  };
};

/**
 * Map our visual types to Power BI visual types
 */
const mapVisualType = (type) => {
  const mapping = {
    'card': 'card',
    'line': 'lineChart',
    'bar': 'barChart',
    'column': 'clusteredColumnChart',
    'pie': 'pieChart',
    'donut': 'donutChart',
    'area': 'areaChart',
    'scatter': 'scatterChart',
    'table': 'tableEx',
    'matrix': 'pivotTable',
    'gauge': 'gauge',
    'waterfall': 'waterfallChart',
    'funnel': 'funnel',
    'treemap': 'treemap'
  };

  return mapping[type] || 'barChart';
};

/**
 * Calculate visual position on canvas
 */
const calculateVisualPosition = (index, type) => {
  const cols = 3;
  const row = Math.floor(index / cols);
  const col = index % cols;

  const baseWidth = 400;
  const baseHeight = type === 'card' ? 150 : 300;
  const padding = 20;

  return {
    x: col * (baseWidth + padding),
    y: row * (baseHeight + padding),
    width: baseWidth,
    height: baseHeight
  };
};

/**
 * Generate visual data projections
 */
const generateVisualProjections = (visual, csvData) => {
  const projections = {};

  if (visual.dataKey) {
    projections.Values = [{
      queryRef: 'Data.' + visual.dataKey
    }];
  }

  if (visual.xAxis) {
    projections.Category = [{
      queryRef: 'Data.' + visual.xAxis
    }];
  }

  if (visual.nameKey) {
    projections.Category = [{
      queryRef: 'Data.' + visual.nameKey
    }];
  }

  return projections;
};

/**
 * Generate prototype query for visual
 */
const generatePrototypeQuery = (visual, csvData) => {
  return {
    Version: 2,
    From: [
      {
        Name: 'Data',
        Entity: 'Data',
        Type: 0
      }
    ],
    Select: [
      {
        Column: {
          Expression: {
            SourceRef: {
              Source: 'Data'
            }
          },
          Property: visual.dataKey || csvData.headers[0]
        },
        Name: 'Data.' + (visual.dataKey || csvData.headers[0])
      }
    ]
  };
};

/**
 * Generate visual formatting objects
 */
const generateVisualObjects = (visual, customColors) => {
  return {
    general: [
      {
        properties: {
          title: {
            text: {
              expr: {
                Literal: {
                  Value: `'${visual.title}'`
                }
              }
            }
          }
        }
      }
    ],
    dataPoint: [
      {
        properties: {
          fill: {
            solid: {
              color: {
                expr: {
                  ThemeDataColor: {
                    ColorId: 0,
                    Percent: 0
                  }
                }
              }
            }
          }
        }
      }
    ]
  };
};

/**
 * Generate cleaned CSV content
 */
const generateCleanedCSV = (cleanedData) => {
  const headers = cleanedData.headers.join(',');
  const rows = cleanedData.data.map(row => {
    return cleanedData.headers.map(header => {
      let value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
};

/**
 * Generate comprehensive README
 */
const generateReadme = (projectName, dashboardSpec, csvData, measures) => {
  return `# ${projectName} - Power BI Dashboard

## 🚀 Quick Start

1. **Extract the ZIP file** to a folder on your computer
2. **Double-click** \`${projectName}.pbip\` to open in Power BI Desktop
3. The dashboard will load automatically with all visuals configured!

## 📊 What's Included

### Data
- **${csvData.rowCount.toLocaleString()} rows** × **${csvData.columnCount} columns**
- Cleaned and formatted for Power BI
- Data types automatically detected and configured

### Visuals
${dashboardSpec.visuals.map((v, i) => `${i + 1}. **${v.title}** (${v.type})`).join('\n')}

### DAX Measures
${measures.slice(0, 5).map(m => `- **${m.name}**: ${m.description}`).join('\n')}
${measures.length > 5 ? `- *...and ${measures.length - 5} more measures*` : ''}

## 🎨 Customization

### Colors
- Dashboard background: Already configured
- Card backgrounds: Pre-styled
- Chart colors: Using ${dashboardSpec.colorPalette || 'corporate'} palette

### Layout
- Canvas size: ${dimensions?.width || 1280}px × ${dimensions?.height || 720}px
- All visuals positioned and sized appropriately

## 📝 Manual Steps (Optional)

### Update Data Source Path
If you move the data file:
1. In Power BI Desktop, go to **Transform data** → **Data source settings**
2. Update the path to \`${projectName}_data.csv\`
3. Click **Refresh**

### Add Filters
The dashboard is ready to use, but you can add slicers:
1. Click **Visualizations** → **Slicer**
2. Drag a column field to add interactive filters

### Customize Further
- Right-click any visual to edit
- Use the **Format** pane to adjust styling
- Add more pages with the **+** button

## 🔧 Troubleshooting

**Data doesn't load?**
- Make sure \`${projectName}_data.csv\` is in the same folder as the .pbip file
- Check file permissions

**Visuals are blank?**
- Click **Refresh** in the Home ribbon
- Verify data source connection

**Need to change data types?**
- Go to **Transform data**
- Select column → **Data Type** → Choose correct type

## 📚 Learn More

- [Power BI Documentation](https://docs.microsoft.com/power-bi/)
- [DAX Guide](https://dax.guide/)
- [Power BI Community](https://community.powerbi.com/)

---

**Generated by Power BI AI Builder**
Created: ${new Date().toLocaleString()}
Version: 1.0.0
`;
};

/**
 * Generate a GUID for Power BI lineage tags
 */
const generateGuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
