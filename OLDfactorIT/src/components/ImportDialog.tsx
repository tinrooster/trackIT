import React, { useState, useCallback, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Upload, Loader2, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (itemsToImport: Partial<InventoryItem>[]) => Promise<{ importedCount: number; skippedCount: number }>;
  onComplete: (importedCount: number, skippedCount: number) => void;
}

// Define expected headers (case-insensitive check later)
const EXPECTED_HEADERS = [
  'name', 'description', 'quantity', 'unit', 'costPerUnit', 'category', 
  'location', 'reorderLevel', 'barcode', 'notes', 'supplier', 
  'supplierWebsite', 'project', 'orderStatus', 'deliveryPercentage', 
  'expectedDeliveryDate' 
  // 'id' and 'lastUpdated' will be handled by the import logic
];

export function ImportDialog({ isOpen, onClose, onImport, onComplete }: ImportDialogProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<{ row: number; errors: string[] }[]>([]);
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setIsLoading(false);
    setError(null);
    setValidationResults([]);
    setFieldMapping({});
    setActiveTab("preview");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    resetState(); // Reset on new file selection
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv') ||
          selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.name.endsWith('.xlsx') ||
          selectedFile.type === 'application/vnd.ms-excel' || selectedFile.name.endsWith('.xls')) 
      {
        setFile(selectedFile);
        parseFile(selectedFile);
      } else {
        setError("Invalid file type. Please upload a CSV or Excel file (.csv, .xlsx, .xls).");
        toast.error("Invalid file type.");
      }
    }
  };

  const parseFile = (fileToParse: File) => {
    setIsLoading(true);
    setError(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true }); // Read dates as Date objects
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Get header row as well

        if (jsonData.length < 2) { // Need header + at least one data row
          throw new Error("File is empty or contains only headers.");
        }

        const fileHeaders = (jsonData[0] as string[]).map(h => String(h).trim()); // Trim headers
        const fileData = jsonData.slice(1).map((row: any) => {
           const rowData: Record<string, any> = {};
           fileHeaders.forEach((header, index) => {
              rowData[header] = row[index];
           });
           return rowData;
        });

        setHeaders(fileHeaders);
        setParsedData(fileData);
        
        // Initialize field mapping with best guesses
        const initialMapping: Record<string, string> = {};
        EXPECTED_HEADERS.forEach(expectedHeader => {
          // Try to find exact match first
          let match = fileHeaders.find(h => h.toLowerCase() === expectedHeader.toLowerCase());
          
          // If no exact match, try to find a header that contains the expected header
          if (!match) {
            match = fileHeaders.find(h => h.toLowerCase().includes(expectedHeader.toLowerCase()));
          }
          
          if (match) {
            initialMapping[expectedHeader] = match;
          }
        });
        
        setFieldMapping(initialMapping);
        validateData(fileHeaders, fileData, initialMapping); // Validate after parsing

      } catch (err: any) {
        console.error("Error parsing file:", err);
        setError(`Error parsing file: ${err.message}`);
        toast.error("Failed to parse file.");
        resetState(); // Clear state on error
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = (err) => {
       console.error("File reading error:", err);
       setError("Error reading file.");
       toast.error("Failed to read file.");
       setIsLoading(false);
    };

    reader.readAsBinaryString(fileToParse);
  };

  const validateData = (fileHeaders: string[], data: any[], mapping: Record<string, string>) => {
    const results: { row: number; errors: string[] }[] = [];

    // Check if required fields are mapped
    const requiredFields = ['name', 'unit'];
    const missingRequiredMappings = requiredFields.filter(field => !mapping[field]);
    
    if (missingRequiredMappings.length > 0) {
      setError(`Missing required field mappings: ${missingRequiredMappings.join(', ')}. Please map these fields.`);
      return;
    }

    data.forEach((row, index) => {
      const errors: string[] = [];
      
      // Check required fields based on mappings
      if (mapping.name && (!row[mapping.name] || String(row[mapping.name]).trim() === '')) {
        errors.push("Missing 'name'");
      }
      
      if (mapping.unit && (!row[mapping.unit] || String(row[mapping.unit]).trim() === '')) {
        errors.push("Missing 'unit'");
      }
      
      if (mapping.quantity) {
        const quantityValue = row[mapping.quantity];
        if (quantityValue === undefined || quantityValue === null || String(quantityValue).trim() === '') {
          errors.push("Missing 'quantity'");
        } else if (isNaN(Number(quantityValue)) || Number(quantityValue) < 0) {
          errors.push("Invalid 'quantity' (must be a non-negative number)");
        }
      }

      // Check numeric types if columns are mapped
      if (mapping.costPerUnit) {
        const costValue = row[mapping.costPerUnit];
        if (costValue !== undefined && costValue !== null && String(costValue).trim() !== '' && 
            (isNaN(Number(costValue)) || Number(costValue) < 0)) {
          errors.push("Invalid 'costPerUnit'");
        }
      }
      
      if (mapping.reorderLevel) {
        const reorderValue = row[mapping.reorderLevel];
        if (reorderValue !== undefined && reorderValue !== null && String(reorderValue).trim() !== '' && 
            (isNaN(Number(reorderValue)) || Number(reorderValue) < 0)) {
          errors.push("Invalid 'reorderLevel'");
        }
      }
      
      if (mapping.deliveryPercentage) {
        const percentValue = row[mapping.deliveryPercentage];
        if (percentValue !== undefined && percentValue !== null && String(percentValue).trim() !== '' && 
            (isNaN(Number(percentValue)) || Number(percentValue) < 0 || Number(percentValue) > 100)) {
          errors.push("Invalid 'deliveryPercentage' (0-100)");
        }
      }

      // Check date format if column is mapped
      if (mapping.expectedDeliveryDate) {
        const dateValue = row[mapping.expectedDeliveryDate];
        if (dateValue && !(dateValue instanceof Date)) {
          // Try parsing common formats if xlsx didn't parse it
          if (isNaN(Date.parse(String(dateValue)))) {
            errors.push("Invalid 'expectedDeliveryDate' format");
          }
        }
      }

      if (errors.length > 0) {
        results.push({ row: index + 2, errors }); // +2 because index is 0-based and we skipped header row
      }
    });
    
    setValidationResults(results);
  };

  const handleFieldMappingChange = (expectedField: string, fileHeader: string) => {
    const newMapping = { ...fieldMapping, [expectedField]: fileHeader };
    setFieldMapping(newMapping);
    validateData(headers, parsedData, newMapping);
  };

  const handleImportClick = async () => {
    if (!parsedData.length || validationResults.length > 0) {
      toast.error("Please fix validation errors before importing.");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Map parsed data to InventoryItem structure using the field mapping
      const itemsToImport: Partial<InventoryItem>[] = parsedData.map(row => {
        const item: Partial<InventoryItem> = {
          // Add user ID for tracking who created the item
          createdBy: user?.id,
          lastModifiedBy: user?.id
        };
        
        // Apply field mapping
        Object.entries(fieldMapping).forEach(([expectedField, fileHeader]) => {
          if (fileHeader) {
            let value = row[fileHeader];

            // Type conversions and cleaning
            if (value !== undefined && value !== null) {
              if (['quantity', 'costPerUnit', 'reorderLevel', 'deliveryPercentage'].includes(expectedField)) {
                value = Number(value);
              } else if (expectedField === 'expectedDeliveryDate') {
                value = value instanceof Date ? value : new Date(value); // Ensure Date object
              } else {
                value = String(value).trim(); // Trim strings
              }
              (item as any)[expectedField] = value;
            }
          }
        });
        
        return item;
      });

      const { importedCount, skippedCount } = await onImport(itemsToImport);
      onComplete(importedCount, skippedCount);
      resetState(); // Reset after successful import

    } catch (err: any) {
      console.error("Import failed:", err);
      setError(`Import failed: ${err.message}`);
      toast.error("Import failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const previewData = parsedData.slice(0, 5); // Show first 5 rows for preview

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetState(); onClose(); } }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import Inventory</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with inventory data. Map your file columns to the expected fields.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="inventory-file">Upload File</Label>
            <Input 
              id="inventory-file" 
              type="file" 
              accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange} 
              disabled={isLoading}
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Parsing file...
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          {parsedData.length > 0 && !error && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="preview">Data Preview</TabsTrigger>
                <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="space-y-4">
                <h3 className="font-semibold">Preview Data (First 5 Rows)</h3>
                <div className="max-h-60 overflow-auto border rounded-md">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        {headers.map((header, index) => (
                          <TableHead key={index}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {headers.map((header, colIndex) => (
                            <TableCell key={colIndex} className="max-w-[100px] truncate" title={String(row[header] ?? '')}>
                              {row[header] instanceof Date ? format(row[header], 'PP') : String(row[header] ?? '')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {validationResults.length > 0 && (
                  <div className="space-y-2 p-3 border border-destructive rounded-md bg-destructive/5">
                    <h4 className="font-semibold text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4"/> Validation Errors ({validationResults.length})
                    </h4>
                    <ul className="list-disc list-inside text-xs max-h-40 overflow-auto">
                      {validationResults.slice(0, 10).map(res => ( // Show first 10 errors
                        <li key={res.row}>Row {res.row}: {res.errors.join(', ')}</li>
                      ))}
                      {validationResults.length > 10 && <li>... and {validationResults.length - 10} more errors</li>}
                    </ul>
                  </div>
                )}
                
                {validationResults.length === 0 && parsedData.length > 0 && (
                  <div className="p-3 border border-green-500 rounded-md bg-green-50 text-green-700 text-sm flex items-center gap-1">
                    <CheckCircle className="h-4 w-4"/> File looks good! Ready to import {parsedData.length} rows.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="mapping" className="space-y-4">
                <h3 className="font-semibold">Map File Columns to Inventory Fields</h3>
                <p className="text-sm text-muted-foreground">
                  Match your file's columns to the expected inventory fields. Required fields are marked with *.
                </p>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto border rounded-md p-4">
                  {EXPECTED_HEADERS.map(expectedField => (
                    <div key={expectedField} className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
                      <div>
                        <Label className="capitalize">
                          {expectedField.replace(/([A-Z])/g, ' $1').trim()}
                          {['name', 'unit'].includes(expectedField) && <span className="text-destructive">*</span>}
                        </Label>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      
                      <Select
                        value={fieldMapping[expectedField] || ""}
                        onValueChange={(value) => handleFieldMappingChange(expectedField, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not mapped</SelectItem>
                          {headers.map(header => (
                            <SelectItem key={header} value={header}>{header}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                
                {Object.keys(fieldMapping).length > 0 && (
                  <div className={`p-3 border rounded-md ${
                    validationResults.length > 0 ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-green-500 bg-green-50 text-green-700'
                  } text-sm flex items-center gap-1`}>
                    {validationResults.length > 0 ? (
                      <>
                        <AlertTriangle className="h-4 w-4"/> 
                        {validationResults.length} validation issues found. Please review the Data Preview tab.
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4"/> 
                        Field mapping looks good! You've mapped {Object.keys(fieldMapping).length} fields.
                      </>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetState(); onClose(); }}>
            Cancel
          </Button>
          <Button 
            onClick={handleImportClick} 
            disabled={isLoading || !file || parsedData.length === 0 || validationResults.length > 0 || !!error}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}