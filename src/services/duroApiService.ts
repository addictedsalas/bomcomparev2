
import { ExcelBomData, ExcelBomItem } from '../models/ExcelBomData';

export interface DuroComponentNode {
  id: string;
  name: string;
  cpn: {
    displayValue: string;
  };
}

export interface DuroComponentEdge {
  node: DuroComponentNode;
}

export interface DuroComponentsResponse {
  data: {
    components: {
      connection: {
        totalCount: number;
        edges: DuroComponentEdge[];
      };
    };
  };
}

export interface DuroChildComponent {
  itemNumber: string;
  quantity: number;
  component: {
    id: string;
    name: string;
    cpn: {
      displayValue: string;
    };
  };
}

export interface DuroComponentByIdResponse {
  data: {
    componentsByIds: Array<{
      id: string;
      name: string;
      cpn: {
        displayValue: string;
      };
      children: DuroChildComponent[];
    }>;
  };
}

const API_URL = '/api/duro';
// Token is now handled in the API route

export class DuroApiService {
  private static async query(query: string): Promise<unknown> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL Error: ${result.errors[0].message}`);
    }

    return result;
  }

  /**
   * Search for a component by its Assembly Number (CPN)
   */
  static async searchComponent(assemblyNumber: string): Promise<DuroComponentNode | null> {
    // We fetch a list and filter client-side or use a search query if available.
    // Based on docs, we'll fetch recently created or just use a broad search for now.
    // Ideally, we should filter by name in the query if possible, but the basic query 
    // provided is just a list. We'll try to fetch a reasonable amount and find it.
    // Note: In a real prod scenario, we'd want a server-side filter.
    // For now, let's try to query for the specific name if the API supports filtering,
    // otherwise we might need to rely on the user providing an exact match or handle large lists.
    
    // Trying a filter query structure usually supported by GraphQL Relay connections if documented.
    // Since we don't have the full schema, we'll fetch a batch. 
    // Actually, let's use the exact query structure from the successful curl, but maybe try 
    // to add a filter if possible. If not, we'll just have to hope it's in the first batch 
    // or implement pagination.
    
    // WAIT: The prompt says "extract the top level components under the assembly".
    // We need to FIND the assembly first. 
    // Let's assume we can filter by 'name' which often maps to CPN/Name.
    
    // Let's try a query that looks for the specific component. 
    // Since I can't easily test filter syntax without trial/error, 
    // I will implement a function that takes the assembly number and tries to find it.
    
    // We use server-side filtering to find the specific component.
    // The 'search' argument takes a SearchFields object with a 'cpn' field.
    const query = `{
      components(libraryType: GENERAL, search: { cpn: "${assemblyNumber}" }) {
        connection(first: 20) {
          edges {
            node {
              id
              name
              cpn {
                displayValue
              }
            }
          }
        }
      }
    }`;

    const result = await this.query(query) as DuroComponentsResponse;
    const edges = result.data.components.connection.edges;
    
    // Find exact match on CPN (double check in case search is fuzzy)
    const match = edges.find(edge => 
      edge.node.cpn?.displayValue === assemblyNumber
    );

    return match ? match.node : null;
  }

  /**
   * Fetch BOM for a specific Component ID
   */
  static async getAssemblyBom(componentId: string): Promise<{ items: ExcelBomItem[], rawChildren: DuroChildComponent[] }> {
    // We need to fetch children and their details (CPN, Name, Qty, Item No)
    // Based on the user provided docs:
    /*
      componentsByIds(id: <some_id>) {
        children {
          itemNumber
          quantity
          component {  <-- Assumption: we can get the component details from the child link
             name
             cpn { displayValue }
          }
        }
      }
    */
   
    const query = `{
      componentsByIds(ids: ["${componentId}"]) {
        id
        name
        children {
          itemNumber
          quantity
          component {
            id
            name
            cpn {
              displayValue
            }
          }
        }
      }
    }`;

    const result = await this.query(query) as DuroComponentByIdResponse;
    const component = result.data.componentsByIds[0];
    
    if (!component) {
      throw new Error('Component not found');
    }

    // Map to ExcelBomData
    const items: ExcelBomItem[] = component.children.map((child: DuroChildComponent) => ({
      itemNumber: child.itemNumber ? String(child.itemNumber) : '',
      partNumber: child.component?.cpn?.displayValue ? String(child.component.cpn.displayValue) : (child.component?.name ? String(child.component.name) : ''),
      description: child.component?.name ? String(child.component.name) : '', // Using name as description for now
      quantity: child.quantity !== undefined && child.quantity !== null ? String(child.quantity) : '1'
    }));

    return { items, rawChildren: component.children };
  }

  /**
   * Fetch raw children for a specific Component ID (used for updates)
   */
  static async getAssemblyChildren(componentId: string): Promise<DuroChildComponent[]> {
    const query = `{
      componentsByIds(ids: ["${componentId}"]) {
        id
        children {
          itemNumber
          quantity
          component {
            id
            name
            cpn {
              displayValue
            }
          }
        }
      }
    }`;

    const result = await this.query(query) as DuroComponentByIdResponse;
    const component = result.data.componentsByIds[0];
    
    if (!component) {
      throw new Error('Component not found');
    }

    return component.children;
  }
  
  /**
   * Combined method to search and get BOM
   */
  static async fetchBomByAssemblyNumber(assemblyNumber: string): Promise<{ bom: ExcelBomData, rawData: DuroChildComponent[], assemblyId: string }> {
    // 1. Search for the component ID
    // Since we can't easily filter server-side without knowing the exact filter syntax,
    // and fetching ALL components is too heavy, we might need a better way.
    // However, the user said "simple assembly number".
    
    // For the POC, let's try to query by name directly if the API supports it, 
    // or just fetch a larger batch.
    // BUT wait, looking at the user's successful curl:
    // { components(libraryType: GENERAL) { connection(first: 10) ... } }
    // It returns a list.
    
    // Let's implement a "smart search" - we'll try to find it in the recent list.
    // Note: In production this likely needs a specific search query.
    
    const node = await this.searchComponent(assemblyNumber);
    
    if (!node) {
      throw new Error(`Assembly '${assemblyNumber}' not found in the recent list. (Note: This POC searches the first 100 items. Full search requires API filter documentation).`);
    }

    // 2. Get the BOM
    const { items, rawChildren } = await this.getAssemblyBom(node.id);
    
    return {
      bom: { items },
      rawData: rawChildren,
      assemblyId: node.id
    };
  }

  /**
   * Update an assembly's BOM (children)
   * This REPLACES the existing children list with the provided list.
   */
  static async updateAssemblyBOM(assemblyId: string, children: { componentId: string; quantity: number; itemNumber: string }[]): Promise<unknown> {
    // Construct the mutation
    // We need to format the children array as a GraphQL input string since we're building the query manually
    // Ideally we should use variables, but for now we'll inline carefully.
    
    const childrenString = children.map(child => {
      const parsedItemNumber = parseInt(child.itemNumber || '0', 10);
      const safeItemNumber = isNaN(parsedItemNumber) ? 0 : parsedItemNumber;
      
      return `{
      componentId: ${JSON.stringify(child.componentId)},
      quantity: ${child.quantity},
      itemNumber: ${safeItemNumber}
    }`;
    }).join(',\n');

    const query = `mutation {
      updateComponent(input: {
        id: "${assemblyId}",
        children: [
          ${childrenString}
        ]
      }) {
        id
        children {
          itemNumber
          quantity
        }
      }
    }`;

    console.log('🚀 Sending Update Mutation:', query);

    return this.query(query);
  }
}
