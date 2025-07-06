export interface WalletPassData {
  storeName: string;
  transactionDate: string;
  totalAmount: string;
  taxAmount?: string;
  subtotal?: string;
  receiptId: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    price: string;
  }>;
  deepLinkUrl?: string;
}

export interface WalletPassResponse {
  passId: string;
  addToWalletUrl: string;
}

export class GoogleWalletService {
  private apiKey: string;
  private issuerId: string;
  
  constructor() {
    this.apiKey = process.env.GOOGLE_WALLET_API_KEY || "";
    this.issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || "3388000000022";
  }

  async createReceiptPass(data: WalletPassData): Promise<WalletPassResponse> {
    try {
      // Create a unique pass ID that includes the receipt ID for tracking
      const passId = `receipt-${data.receiptId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create deep link URL that opens the Raseed app to chat with this receipt
      const deepLinkUrl = data.deepLinkUrl || `raseed://receipt/${data.receiptId}/chat`;
      
      // Format line items for the pass
      const lineItemsFormatted = this.formatLineItemsForPass(data.lineItems);
      
      // Create enhanced pass object structure with detailed receipt information
      const passObject = {
        id: passId,
        classId: `${this.issuerId}.receipt_class`,
        genericObject: {
          cardTitle: {
            defaultValue: {
              language: 'en-US',
              value: 'Receipt - ' + data.storeName
            }
          },
          subheader: {
            defaultValue: {
              language: 'en-US',
              value: `Transaction Date: ${data.transactionDate}`
            }
          },
          header: {
            defaultValue: {
              language: 'en-US',
              value: `Total: $${data.totalAmount}`
            }
          },
          barcode: {
            type: 'QR_CODE',
            value: deepLinkUrl,
            alternateText: `Receipt #${data.receiptId}`
          },
          logo: {
            sourceUri: {
              uri: 'https://storage.googleapis.com/raseed-assets/logo.png'
            }
          },
          hexBackgroundColor: '#1976D2',
          textModulesData: [
            // Store and transaction info
            {
              id: 'store_info',
              header: 'Store',
              body: data.storeName
            },
            {
              id: 'transaction_date',
              header: 'Date',
              body: data.transactionDate
            },
            {
              id: 'total_amount',
              header: 'Total',
              body: `$${data.totalAmount}`
            },
            ...(data.taxAmount ? [{
              id: 'tax_amount',
              header: 'Tax',
              body: `$${data.taxAmount}`
            }] : []),
            ...(data.subtotal ? [{
              id: 'subtotal',
              header: 'Subtotal',
              body: `$${data.subtotal}`
            }] : []),
            // Line items (limited to first 5 for space)
            ...lineItemsFormatted.slice(0, 5).map((item, index) => ({
              id: `line_item_${index}`,
              header: `Item ${index + 1}`,
              body: item
            })),
            ...(lineItemsFormatted.length > 5 ? [{
              id: 'more_items',
              header: 'More Items',
              body: `+${lineItemsFormatted.length - 5} more items. View all in app.`
            }] : []),
            // Chat prompt
            {
              id: 'chat_prompt',
              header: 'AI Assistant',
              body: 'Tap QR code to chat about this receipt with Raseed AI'
            }
          ],
          linksModuleData: {
            uris: [
              {
                uri: deepLinkUrl,
                description: 'Chat with AI about this receipt',
                id: 'chat_link'
              }
            ]
          },
          imageModulesData: [
            {
              id: 'receipt_icon',
              mainImage: {
                sourceUri: {
                  uri: 'https://storage.googleapis.com/raseed-assets/receipt-icon.png'
                }
              }
            }
          ]
        }
      };

      // In production, you would make an actual API call to Google Wallet API here
      // For now, simulate the response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const addToWalletUrl = `https://pay.google.com/gp/v/save/${passId}`;
      
      console.log(`Created wallet pass for receipt ${data.receiptId}:`, passObject);
      
      return {
        passId,
        addToWalletUrl
      };
    } catch (error) {
      console.error('Error creating wallet pass:', error);
      throw new Error('Failed to create wallet pass');
    }
  }

  private formatLineItemsForPass(lineItems: WalletPassData['lineItems']): string[] {
    return lineItems.map(item => 
      `${item.description} (${item.quantity}x) - ${item.price}`
    );
  }
}

export const walletService = new GoogleWalletService();
