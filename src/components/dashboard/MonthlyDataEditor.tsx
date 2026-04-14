import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditableInput } from "@/components/ui/editable-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Users, Target, FileText, DollarSign } from "lucide-react";
import { SupabaseClient, MonthlyData } from "@/hooks/useSupabaseData";
interface MonthlyDataEditorProps {
  client: SupabaseClient;
  onUpdateMonthlyData: (clientId: string, month: string, data: Omit<MonthlyData, 'id' | 'client_id' | 'month' | 'created_at' | 'updated_at'>) => Promise<void>;
}
export function MonthlyDataEditor({
  client,
  onUpdateMonthlyData
}: MonthlyDataEditorProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('2024-01');
  const months = [{
    value: '2024-01',
    label: 'Janeiro 2024'
  }, {
    value: '2024-02',
    label: 'Fevereiro 2024'
  }, {
    value: '2024-03',
    label: 'Março 2024'
  }, {
    value: '2024-04',
    label: 'Abril 2024'
  }, {
    value: '2024-05',
    label: 'Maio 2024'
  }, {
    value: '2024-06',
    label: 'Junho 2024'
  }, {
    value: '2024-07',
    label: 'Julho 2024'
  }, {
    value: '2024-08',
    label: 'Agosto 2024'
  }, {
    value: '2024-09',
    label: 'Setembro 2024'
  }, {
    value: '2024-10',
    label: 'Outubro 2024'
  }, {
    value: '2024-11',
    label: 'Novembro 2024'
  }, {
    value: '2024-12',
    label: 'Dezembro 2024'
  }];
  const currentMonthData = client.monthlyData.find(md => md.month === selectedMonth) || {
    contacts: 0,
    qualified_leads: 0,
    meetings: 0,
    proposals: 0,
    sales: 0,
    revenue: 0
  };
  const handleUpdateField = async (field: string, value: string | number) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    await onUpdateMonthlyData(client.id, selectedMonth, {
      ...currentMonthData,
      [field]: numericValue
    });
  };
  const getConversionRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return (current / previous * 100).toFixed(1);
  };
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Dados Mensais</h3>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <label className="text-sm font-medium">Contatos</label>
            </div>
            <EditableInput
              value={currentMonthData.contacts}
              onSave={(value) => handleUpdateField('contacts', value)}
              type="number"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <label className="text-sm font-medium">Leads Qualificados</label>
            </div>
            <EditableInput
              value={currentMonthData.qualified_leads}
              onSave={(value) => handleUpdateField('qualified_leads', value)}
              type="number"
            />
            <Badge variant="outline" className="text-xs">
              {getConversionRate(currentMonthData.qualified_leads, currentMonthData.contacts)}% conv.
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <label className="text-sm font-medium">Reuniões</label>
            </div>
            <EditableInput
              value={currentMonthData.meetings}
              onSave={(value) => handleUpdateField('meetings', value)}
              type="number"
            />
            <Badge variant="outline" className="text-xs">
              {getConversionRate(currentMonthData.meetings, currentMonthData.qualified_leads)}% conv.
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <label className="text-sm font-medium">Propostas</label>
            </div>
            <EditableInput
              value={currentMonthData.proposals}
              onSave={(value) => handleUpdateField('proposals', value)}
              type="number"
            />
            <Badge variant="outline" className="text-xs">
              {getConversionRate(currentMonthData.proposals, currentMonthData.meetings)}% conv.
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <label className="text-sm font-medium">Vendas</label>
            </div>
            <EditableInput
              value={currentMonthData.sales}
              onSave={(value) => handleUpdateField('sales', value)}
              type="number"
            />
            <Badge variant="outline" className="text-xs">
              {getConversionRate(currentMonthData.sales, currentMonthData.proposals)}% conv.
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <label className="text-sm font-medium">Faturamento</label>
            </div>
            <EditableInput
              value={currentMonthData.revenue}
              onSave={(value) => handleUpdateField('revenue', value)}
              type="currency"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}