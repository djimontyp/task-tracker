import { useState, useEffect } from 'react';
import { Card } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Slider } from '@/shared/ui/slider';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Spinner } from '@/shared/ui';
import { versioningService } from '@/features/knowledge/api/versioningService';
import type { AutoApprovalRule } from '@/features/knowledge/types';
import toast from 'react-hot-toast';

export default function AutoApprovalSettingsPage() {
  const [rule, setRule] = useState<AutoApprovalRule>({
    enabled: false,
    confidence_threshold: 70,
    similarity_threshold: 60,
    action: 'approve',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  useEffect(() => {
    loadRule();
  }, []);

  const loadRule = async () => {
    setLoading(true);
    try {
      const fetchedRule = await versioningService.getAutoApprovalRule();
      setRule(fetchedRule);
    } catch (error) {
      console.error('Failed to load auto-approval rule:', error);
      toast.error('Не вдалося завантажити налаштування');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (rule.confidence_threshold < rule.similarity_threshold) {
      toast.error('Поріг впевненості має бути не менше порогу схожості');
      return;
    }

    setSaving(true);
    try {
      await versioningService.updateAutoApprovalRule(rule);
      toast.success('Налаштування збережено');
    } catch (error) {
      console.error('Failed to save rule:', error);
      toast.error('Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const result = await versioningService.previewAutoApprovalImpact(rule);
      setPreviewCount(result.affected_count);
      toast.success(`Налаштування вплинуть на ${result.affected_count} версій`);
    } catch (error) {
      console.error('Failed to preview impact:', error);
      toast.error('Не вдалося отримати попередній перегляд');
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl">Автоматичне схвалення версій</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Налаштуйте правила автоматичної обробки версій на основі метрик якості
        </p>
      </div>

      <Card className="p-4 md:p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enable-toggle" className="text-base font-semibold">
                Увімкнути автоматичне схвалення
              </Label>
              <p className="text-sm text-gray-500">
                Автоматично обробляти версії на основі порогових значень
              </p>
            </div>
            <Switch
              id="enable-toggle"
              checked={rule.enabled}
              onCheckedChange={(checked) => setRule({ ...rule, enabled: checked })}
            />
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-700" />

          <div className="space-y-4 opacity-100 transition-opacity" style={{ opacity: rule.enabled ? 1 : 0.5 }}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Поріг впевненості ({rule.confidence_threshold}%)</Label>
                <span className="text-xs text-gray-500">0% - 100%</span>
              </div>
              <Slider
                value={[rule.confidence_threshold]}
                onValueChange={([value]) => setRule({ ...rule, confidence_threshold: value })}
                min={0}
                max={100}
                step={5}
                disabled={!rule.enabled}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Мінімальна впевненість моделі для автоматичної обробки
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Поріг схожості ({rule.similarity_threshold}%)</Label>
                <span className="text-xs text-gray-500">0% - 100%</span>
              </div>
              <Slider
                value={[rule.similarity_threshold]}
                onValueChange={([value]) => setRule({ ...rule, similarity_threshold: value })}
                min={0}
                max={100}
                step={5}
                disabled={!rule.enabled}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Мінімальна векторна схожість для автоматичної обробки
              </p>
            </div>

            {rule.confidence_threshold < rule.similarity_threshold && (
              <div className="rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Поріг впевненості має бути не менше порогу схожості
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium">Дія для версій, що відповідають критеріям</Label>
              <Select
                value={rule.action}
                onValueChange={(value: 'approve' | 'reject' | 'manual') =>
                  setRule({ ...rule, action: value })
                }
                disabled={!rule.enabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-500">Схвалити</Badge>
                      <span className="text-sm">Автоматично схвалювати версії</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="reject">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Відхилити</Badge>
                      <span className="text-sm">Автоматично відхиляти версії</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="manual">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Вручну</Badge>
                      <span className="text-sm">Залишити для ручного перегляду</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-700" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!rule.enabled || previewLoading || rule.confidence_threshold < rule.similarity_threshold}
              >
                {previewLoading ? 'Перевірка...' : 'Попередній перегляд'}
              </Button>
              {previewCount !== null && (
                <Badge variant="secondary" className="text-xs">
                  Вплине на {previewCount} версій
                </Badge>
              )}
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || (rule.enabled && rule.confidence_threshold < rule.similarity_threshold)}
            >
              {saving ? 'Збереження...' : 'Зберегти налаштування'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">Як це працює</h3>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>• Версії автоматично оцінюються на основі впевненості моделі та векторної схожості</li>
          <li>• Якщо обидва порогові значення перевищені, виконується обрана дія</li>
          <li>• Версії, які не відповідають критеріям, залишаються для ручного перегляду</li>
          <li>• Ви можете переглянути, скільки версій будуть оброблені, перш ніж зберігати</li>
        </ul>
      </Card>
    </div>
  );
}
