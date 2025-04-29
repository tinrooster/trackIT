import { Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

interface DebugLogsButtonProps {
  onDownload: () => void;
  context?: string; // Optional context to identify which component generated the logs
}

export function DebugLogsButton({ onDownload, context = 'general' }: DebugLogsButtonProps) {
  const handleDownload = async () => {
    try {
      // Call the provided onDownload function to get the logs
      onDownload();

      // Show success message with the logs location
      toast.success(`Logs saved to /logs/${context}_${new Date().toISOString().split('T')[0]}.log`);
    } catch (error) {
      console.error('Error downloading logs:', error);
      toast.error('Failed to download logs');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-2 left-2 h-6 w-6 opacity-30 hover:opacity-100"
            onClick={handleDownload}
          >
            <Bug className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Save Debug Logs to /logs</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 