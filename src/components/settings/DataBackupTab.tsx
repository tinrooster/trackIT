import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Upload, Save, RefreshCw, FileJson, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { InventoryItem } from '@/types/inventory';
import { saveAs } from 'file-saver';

interface DataBackupTabProps {
  onExportData: () => void;
  onExportExcel: () => void;
  onImportData: (file: File) => Promise<void>;
  onImportExcel: (file: File) => Promise<void>;
  onBackupData: () => void;
  onRestoreData: (file: File) => Promise<void>;
}

export function DataBackupTab({
  onExportData,
  onExportExcel,
  onImportData,
  onImportExcel,
  onBackupData,
  onRestoreData
}: DataBackupTabProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('import-export');
  const [isImporting, setIsImporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const jsonImportRef = React.useRef<HTMLInputElement>(null);
  const excelImportRef = React.useRef<HTMLInputElement>(null);
  const restoreRef = React.useRef<HTMLInputElement>(null);

  const handleJsonFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsImporting(true);
      await onImportData(file);
      toast({
        title: "Import successful",
        description: "Your data has been imported successfully.",
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (jsonImportRef.current) {
        jsonImportRef.current.value = '';
      }
    }
  };

  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await onImportExcel(file);
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      if (excelImportRef.current) {
        excelImportRef.current.value = '';
      }
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsRestoring(true);
      await onRestoreData(file);
      toast({
        title: "Restore successful",
        description: "Your backup has been restored successfully.",
      });
    } catch (error) {
      toast({
        title: "Restore failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
      if (restoreRef.current) {
        restoreRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>Data Management</AlertTitle>
        <AlertDescription>
          Use these tools to import, export, backup, and restore your data. 
          Always create a backup before making significant changes.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import-export">Import & Export</TabsTrigger>
          <TabsTrigger value="backup-restore">Backup & Restore</TabsTrigger>
        </TabsList>

        <TabsContent value="import-export" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Import & Export Data
              </CardTitle>
              <CardDescription>
                Import data from another system or export your current data in JSON format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Export Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Export your current data to a JSON file that can be used for imports.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={onExportData}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                    >
                      Export as JSON
                    </Button>
                    <Button 
                      onClick={onExportExcel}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                    >
                      Export as Excel
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Import Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Import data from a JSON file. This will merge with your current data.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                      onClick={() => jsonImportRef.current?.click()}
                    >
                      Import JSON
                    </Button>
                    <input 
                      type="file" 
                      ref={jsonImportRef}
                      onChange={handleJsonFileChange}
                      accept=".json"
                      className="hidden" 
                    />
                    
                    <Button 
                      variant="outline" 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                      onClick={() => excelImportRef.current?.click()}
                    >
                      Import Excel
                    </Button>
                    <input 
                      type="file" 
                      ref={excelImportRef}
                      onChange={handleExcelFileChange}
                      accept=".xlsx,.xls"
                      className="hidden" 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup-restore" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup & Restore
              </CardTitle>
              <CardDescription>
                Create a complete backup of your system or restore from a previous backup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Create Backup</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a complete backup of your data, settings, and configurations.
                  </p>
                  <Button 
                    onClick={onBackupData}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Create Backup
                  </Button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Restore Backup</h3>
                  <p className="text-sm text-muted-foreground">
                    Restore your system from a previous backup file.
                  </p>
                  <Button 
                    variant="outline" 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                    onClick={() => restoreRef.current?.click()}
                  >
                    Restore from Backup
                  </Button>
                  <input 
                    type="file" 
                    ref={restoreRef}
                    onChange={handleRestore}
                    accept=".json"
                    className="hidden" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 