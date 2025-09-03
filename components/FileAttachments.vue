<template>
  <div v-if="files.length" class="space-y-2">
    <div
      class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
    >
      <UIcon name="i-heroicons-paper-clip" class="w-4 h-4" />
      <span
        >{{ files.length }} file{{
          files.length !== 1 ? "s" : ""
        }}
        attached</span
      >
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div
        v-for="file in files"
        :key="file.name"
        :class="[
          'group relative p-3 border rounded-lg transition-all duration-200',
          file.selected
            ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20'
            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
        ]"
      >
        <div class="flex items-start gap-3">
          <UCheckbox v-model="file.selected" class="mt-0.5" />

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <UIcon
                :name="getFileIcon(file.name)"
                class="w-4 h-4 text-gray-500 dark:text-gray-400"
              />
              <span
                class="text-sm font-medium text-gray-900 dark:text-white truncate"
              >
                {{ file.name }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <UBadge
                size="xs"
                :color="file.selected ? 'primary' : 'gray'"
                variant="soft"
              >
                {{ formatTokens(file.tokens) }} tokens
              </UBadge>

              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ getFileSize(file.file?.size) }}
              </span>
            </div>

            <!-- Processing indicator for this specific file -->
            <div
              v-if="processingFileName === file.name && processingMessage"
              class="flex items-center gap-2 mt-2 text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-2 py-1"
            >
              <UIcon name="i-heroicons-sparkles" class="w-3 h-3 animate-pulse" />
              <span>{{ processingMessage }}</span>
            </div>
          </div>

          <!-- Remove button or processing spinner -->
          <UButton
            v-if="processingFileName !== file.name || !processingMessage"
            size="xs"
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            @click="handleRemoveFile(file)"
          />
          <div
            v-else
            class="flex items-center justify-center w-6 h-6"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-primary-500" />
          </div>
        </div>
      </div>
    </div>

    <!-- Selection Summary -->
    <div
      v-if="selectedCount > 0"
      class="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
    >
      <UIcon
        name="i-heroicons-information-circle"
        class="w-4 h-4 text-blue-600 dark:text-blue-400"
      />
      <span class="text-sm text-blue-800 dark:text-blue-200">
        {{ selectedCount }} file{{ selectedCount !== 1 ? "s" : "" }} selected
        ({{ totalSelectedTokens.toLocaleString() }} tokens)
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  files: {
    type: Array,
    required: true,
  },
  processingFileName: {
    type: String,
    default: "",
  },
  processingMessage: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["remove"]);

const selectedCount = computed(() => {
  return props.files.filter((file) => file.selected).length;
});

const totalSelectedTokens = computed(() => {
  return props.files
    .filter((file) => file.selected)
    .reduce((total, file) => total + (file.tokens || 0), 0);
});

const getFileIcon = (filename) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  const iconMap = {
    pdf: "i-heroicons-document",
    doc: "i-heroicons-document-text",
    docx: "i-heroicons-document-text",
    txt: "i-heroicons-document-text",
    md: "i-heroicons-document-text",
    js: "i-heroicons-code-bracket",
    ts: "i-heroicons-code-bracket",
    py: "i-heroicons-code-bracket",
    json: "i-heroicons-code-bracket",
    html: "i-heroicons-code-bracket",
    css: "i-heroicons-code-bracket",
    png: "i-heroicons-photo",
    jpg: "i-heroicons-photo",
    jpeg: "i-heroicons-photo",
    gif: "i-heroicons-photo",
    csv: "i-heroicons-table-cells",
    xlsx: "i-heroicons-table-cells",
    xls: "i-heroicons-table-cells",
  };
  return iconMap[ext] || "i-heroicons-document";
};

const formatTokens = (tokens) => {
  if (!tokens) return "0";
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}k`;
  return `${(tokens / 1000000).toFixed(1)}M`;
};

const getFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const handleRemoveFile = (file) => {
  emit("remove", file);
};
</script>
