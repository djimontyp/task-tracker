import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { toast } from 'sonner';
import { PageWrapper } from '@/shared/primitives';

export default function AutoApprovalSettingsPage() {
  const { t } = useTranslation('autoApproval');
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
      toast.error(t('messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (rule.confidence_threshold < rule.similarity_threshold) {
      toast.error(t('validation.confidenceLowerThanSimilarity'));
      return;
    }

    setSaving(true);
    try {
      await versioningService.updateAutoApprovalRule(rule);
      toast.success(t('messages.settingsSaved'));
    } catch (error) {
      console.error('Failed to save rule:', error);
      toast.error(t('messages.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const result = await versioningService.previewAutoApprovalImpact(rule);
      setPreviewCount(result.affected_count);
      toast.success(t('messages.previewSuccess', { count: result.affected_count }));
    } catch (error) {
      console.error('Failed to preview impact:', error);
      toast.error(t('messages.previewFailed'));
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
    <PageWrapper variant="centered">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <Card className="p-4 md:p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Label htmlFor="enable-toggle" className="text-base font-semibold">
                {t('settings.enable.title')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.enable.description')}
              </p>
            </div>
            <Switch
              id="enable-toggle"
              checked={rule.enabled}
              onCheckedChange={(checked) => setRule({ ...rule, enabled: checked })}
            />
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-4 opacity-100 transition-opacity" style={{ opacity: rule.enabled ? 1 : 0.5 }}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {t('settings.confidenceThreshold.title', { value: rule.confidence_threshold })}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {t('settings.confidenceThreshold.range')}
                </span>
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
              <p className="text-xs text-muted-foreground">
                {t('settings.confidenceThreshold.description')}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {t('settings.similarityThreshold.title', { value: rule.similarity_threshold })}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {t('settings.similarityThreshold.range')}
                </span>
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
              <p className="text-xs text-muted-foreground">
                {t('settings.similarityThreshold.description')}
              </p>
            </div>

            {rule.confidence_threshold < rule.similarity_threshold && (
              <div className="rounded-md bg-semantic-warning/10 p-4 border border-semantic-warning/20">
                <p className="text-sm text-semantic-warning">
                  {t('validation.confidenceLowerThanSimilarity')}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <Label className="text-sm font-medium">{t('settings.action.title')}</Label>
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
                      <Badge variant="default" className="bg-semantic-success">
                        {t('settings.action.approve')}
                      </Badge>
                      <span className="text-sm">{t('settings.action.approveDescription')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="reject">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{t('settings.action.reject')}</Badge>
                      <span className="text-sm">{t('settings.action.rejectDescription')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="manual">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{t('settings.action.manual')}</Badge>
                      <span className="text-sm">{t('settings.action.manualDescription')}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!rule.enabled || previewLoading || rule.confidence_threshold < rule.similarity_threshold}
              >
                {previewLoading ? t('actions.previewing') : t('actions.preview')}
              </Button>
              {previewCount !== null && (
                <Badge variant="secondary" className="text-xs">
                  {t('actions.impact', { count: previewCount })}
                </Badge>
              )}
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || (rule.enabled && rule.confidence_threshold < rule.similarity_threshold)}
            >
              {saving ? t('actions.saving') : t('actions.save')}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-semantic-info/30 bg-semantic-info/10 p-4">
        <h3 className="mb-2 font-semibold text-semantic-info">{t('info.howItWorks')}</h3>
        <ul className="space-y-2 text-sm text-semantic-info/90">
          {(t('info.details', { returnObjects: true }) as string[]).map((detail, index) => (
            <li key={index}>{'• '}{detail}</li>
          ))}
        </ul>
      </Card>
    </PageWrapper>
  );
}
