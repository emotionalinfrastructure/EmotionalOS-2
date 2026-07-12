{{- define "ei-middleware.fullname" -}}
{{ .Release.Name }}
{{- end -}}

{{- define "ei-middleware.labels" -}}
app.kubernetes.io/part-of: emotional-infrastructure
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "ei-middleware.secretName" -}}
{{- if .Values.secrets.existingSecretName -}}
{{ .Values.secrets.existingSecretName }}
{{- else -}}
{{ .Release.Name }}-secrets
{{- end -}}
{{- end -}}
