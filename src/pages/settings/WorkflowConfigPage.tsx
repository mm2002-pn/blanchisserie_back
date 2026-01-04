import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { Plus, Play, CheckCircle, Clock, AlertCircle, Settings } from 'lucide-react';
import { usePermissions } from '@/hooks';
import workflowsData from '@/mocks/data/workflows.json';

export default function WorkflowConfigPage() {
  const { canEdit } = usePermissions();
  const [workflows] = useState(workflowsData);
  const [selectedWorkflow, setSelectedWorkflow] = useState(workflows[0]);

  const categoryBadgeVariants: Record<string, 'success' | 'warning' | 'info' | 'gray'> = {
    'LP': 'info',
    'LF': 'success',
    'NAE': 'warning',
    'ALL': 'gray',
  };

  const zoneBadgeVariants: Record<string, 'success' | 'warning' | 'error' | 'gray' | 'info'> = {
    'Zone propre': 'success',
    'Zone sale': 'error',
    'Zone NAE séparée': 'warning',
    'Externe': 'info',
    'Système': 'gray',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">Configuration des workflows</h2>
          <p className="text-gray-600 mt-1">{workflows.length} workflows configurés</p>
        </div>
        {canEdit('settings') && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau workflow
          </Button>
        )}
      </div>

      {/* Workflow Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {workflows.map((workflow) => (
          <Card
            key={workflow.id}
            className={`cursor-pointer transition-all ${
              selectedWorkflow.id === workflow.id
                ? 'border-accent-500 border-2 bg-accent-50'
                : 'hover:border-gray-300'
            }`}
            onClick={() => setSelectedWorkflow(workflow)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Badge variant={categoryBadgeVariants[workflow.linenCategory]} className="text-xs">
                  {workflow.linenCategory}
                </Badge>
                <Badge variant={workflow.isActive ? 'success' : 'error'} className="text-xs">
                  {workflow.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{workflow.name}</h3>
              <p className="text-xs text-gray-600 mb-3">{workflow.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{workflow.steps.length} étapes</span>
                <span>{workflow.estimatedDuration} min</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedWorkflow.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{selectedWorkflow.description}</p>
            </div>
            {canEdit('settings') && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                {selectedWorkflow.isAutomatic && (
                  <Badge variant="info">Automatique</Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Workflow Info */}
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Code</p>
              <p className="font-medium text-gray-900">{selectedWorkflow.code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Catégorie</p>
              <Badge variant={categoryBadgeVariants[selectedWorkflow.linenCategory]}>
                {selectedWorkflow.linenCategory}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nombre d'étapes</p>
              <p className="font-medium text-gray-900">{selectedWorkflow.steps.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Durée totale</p>
              <p className="font-medium text-gray-900">{selectedWorkflow.estimatedDuration} min</p>
            </div>
          </div>

          {/* Workflow Steps Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Étapes du workflow</h3>

            {selectedWorkflow.steps.map((step, index) => (
              <div key={step.code} className="relative">
                {/* Connector Line */}
                {index < selectedWorkflow.steps.length - 1 && (
                  <div className="absolute left-6 top-14 w-0.5 h-16 bg-gray-300" />
                )}

                {/* Step Card */}
                <div className="flex gap-4">
                  {/* Step Number */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-accent-600 font-bold">{step.order}</span>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pb-4">
                    <Card className="border-l-4 border-accent-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{step.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                          </div>
                          <Badge variant={zoneBadgeVariants[step.zone]} className="text-xs ml-2">
                            {step.zone}
                          </Badge>
                        </div>

                        {/* Step Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Acteur</p>
                            <p className="font-medium text-gray-900">{step.actor}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Lieu</p>
                            <p className="font-medium text-gray-900">{step.location}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Durée estimée</p>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-600" />
                              <span className="font-medium text-gray-900">{step.duration} min</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Transition</p>
                            <p className="font-medium text-gray-900">
                              {step.nextStepAuto ? 'Auto' : 'Manuelle'}
                            </p>
                          </div>
                        </div>

                        {/* Required Fields */}
                        {step.requiredFields && step.requiredFields.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Champs requis:</p>
                            <div className="flex flex-wrap gap-1">
                              {step.requiredFields.map((field, idx) => (
                                <Badge key={idx} variant="gray" className="text-xs">
                                  {field.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Features */}
                        <div className="flex flex-wrap gap-2">
                          {((step as any).machineRequired ?? false) && (
                            <Badge variant="warning" className="text-xs">
                              <Settings className="w-3 h-3 mr-1" />
                              Machine requise
                            </Badge>
                          )}
                          {((step as any).qualityCheck ?? false) && (
                            <Badge variant="success" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Contrôle qualité
                            </Badge>
                          )}
                          {step.nextStepAuto && (
                            <Badge variant="info" className="text-xs">
                              <Play className="w-3 h-3 mr-1" />
                              Passage auto
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Workflow Summary */}
          <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <h4 className="font-semibold text-gray-900 mb-3">Résumé du workflow</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Points de contrôle qualité</p>
                <p className="text-lg font-bold text-primary-600">
                  {selectedWorkflow.steps.filter(s => (s as any).qualityCheck ?? false).length}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Machines utilisées</p>
                <p className="text-lg font-bold text-primary-600">
                  {selectedWorkflow.steps.filter(s => (s as any).machineRequired ?? false).length}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Transitions automatiques</p>
                <p className="text-lg font-bold text-primary-600">
                  {selectedWorkflow.steps.filter(s => s.nextStepAuto).length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Card className="border-warning-200 bg-warning-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-warning-900 mb-1">À propos des workflows</h4>
              <p className="text-sm text-warning-700">
                Chaque type de linge suit un workflow spécifique optimisé pour sa nature.
                Les workflows définissent les étapes obligatoires, les contrôles qualité,
                les machines requises et les acteurs responsables. La modification d'un workflow
                affecte toutes les nouvelles commandes de cette catégorie.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
