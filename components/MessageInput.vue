<template>
  <div class="shrink-0 bg-white dark:bg-gray-900">
    <!-- Input container -->
    <div
      class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 lg:px-4 py-3 lg:py-4"
    >
      <div class="max-w-5xl lg:max-w-6xl mx-auto">
        <!-- File attachments -->
        <FileAttachments
          v-if="attachedFiles.length > 0"
          :files="attachedFiles"
          :processing-file-name="processingFileName"
          :processing-message="processingMessage"
          class="mb-3"
          @remove="removeFile"
        />

        <!-- Input Area -->
        <form class="relative" @submit.prevent="handleSendMessage">
          <div
            class="flex items-end gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-3 transition-colors focus-within:border-primary-300 dark:focus-within:border-primary-600"
          >
            <!-- File attachment button -->
            <UButton
              type="button"
              color="gray"
              variant="ghost"
              icon="i-heroicons-paper-clip"
              size="sm"
              :disabled="loader"
              class="mb-1"
              @click="triggerFileInput"
            />

            <!-- Text input -->
            <UTextarea
              v-model="inputMessage"
              placeholder="Message your AI agent..."
              class="flex-grow min-w-0 border-0 bg-transparent resize-none focus:ring-0 px-0"
              :rows="1"
              :auto-size="true"
              :max-rows="6"
              :disabled="loader"
              @keydown="handleKeyDown"
            />

            <!-- Send button -->
            <UButton
              type="submit"
              :loading="loader"
              :disabled="!inputMessage.trim() || loader"
              color="primary"
              icon="i-heroicons-paper-airplane"
              size="sm"
              class="mb-1 flex-shrink-0"
            />
          </div>


          <!-- Input hints -->
          <div
            class="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400"
          >
            <div class="flex items-center gap-4">
              <span>Press Shift+Enter for new line</span>
              <span
                v-if="selectedFiles.length > 0"
                class="flex items-center gap-1"
              >
                <UIcon name="i-heroicons-paper-clip" class="w-3 h-3" />
                {{ selectedFiles.length }} file{{
                  selectedFiles.length !== 1 ? "s" : ""
                }}
                attached
              </span>
            </div>
            <div class="flex items-center gap-1">
              <span>{{ inputMessage.length }}</span>
              <span>/</span>
              <span class="text-gray-400">4000</span>
            </div>
          </div>
        </form>

        <!-- Hidden file input -->
        <input
          ref="fileInput"
          type="file"
          accept=".txt,.js,.ts,.json,.html,.htm,.md,.markdown,.xml,.csv,.css,.scss,.less,.yaml,.yml,.toml,.ini,.conf,.log,.pdf,.doc,.docx,.xls,.xlsx,.pptx,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tiff,text/*"
          multiple
          class="hidden"
          @change="handleFileSelect"
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
const route = useRoute();
const { loader } = useLoader();
const { messages } = useApp();
const toast = useToast();

const props = defineProps({
  attachedFiles: {
    type: Array,
    default: () => [],
    required: true,
  },
});

const emit = defineEmits(["update:attachedFiles", "send-message"]);

const inputMessage = ref("");
const fileInput = ref(null);
const processingFileName = ref("");
const processingMessage = ref("");

// Quick suggestion prompts
const quickSuggestions = ref([
  "Explain this concept",
  "Write a summary",
  "Help me debug this",
  "What are the best practices?",
]);

const selectedFiles = computed(() => {
  return (props.attachedFiles || [])
    .filter((file) => file.selected)
    .map((file) => file.id);
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleKeyDown = (event) => {
  // Send on Enter (but not Shift+Enter)
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSendMessage();
  }
};

const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  loader.value = true;

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (limit to 32MB to match Claude API limits)
      if (file.size > 32 * 1024 * 1024) {
        toast.add({
          title: "File too large",
          description: `${file.name} is larger than 32MB (Claude API limit)`,
          color: "red",
          icon: "i-heroicons-exclamation-triangle",
        });
        continue;
      }

      // Create file entry immediately to show in UI
      const newFile = {
        file,
        name: file.name,
        selected: true,
        tokens: 0, // Will be updated after processing
        id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID
        isProcessing: true,
      };

      // Add file to UI immediately
      emit("update:attachedFiles", [...props.attachedFiles, newFile]);

      // Set which file is currently being processed
      processingFileName.value = file.name;

      // Update processing message based on file type
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const isImage = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff'].includes(fileExt);
      const isDocument = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'pptx'].includes(fileExt);
      
      if (isImage) {
        processingMessage.value = `Extracting text using OCR...`;
      } else if (isDocument) {
        processingMessage.value = `Processing document and extracting text content...`;
      } else {
        processingMessage.value = `Processing with Claude API...`;
      }

      const formData = new FormData();
      formData.append("file", file);

      const fileReq = await $fetch(`/api/threads/${route.params.id}/files`, {
        method: "post",
        body: formData,
      });

      // Update the file with real data from server
      const updatedFile = {
        file,
        name: file.name,
        selected: true,
        tokens: fileReq.file.tokens,
        id: fileReq.last_row_id,
        isProcessing: false,
      };

      // Update the file in the array
      const updatedFiles = props.attachedFiles.map(f => 
        f.name === file.name && f.isProcessing ? updatedFile : f
      );
      
      emit("update:attachedFiles", updatedFiles);

      // Success toast with more specific messaging
      const processType = isImage ? "OCR processed" : isDocument ? "Text extracted" : "Processed";
      toast.add({
        title: "File ready",
        description: `${file.name} - ${processType} with Claude API (${fileReq.file.tokens} tokens)`,
        color: "green",
        icon: "i-heroicons-sparkles",
      });
    }
  } catch (error) {
    console.error("Error uploading files:", error);
    const errorMessage = error.data?.message || error.message || "Could not process files with Claude API";
    
    // Remove the failed file from the UI
    const failedFileName = processingFileName.value;
    if (failedFileName) {
      const filteredFiles = props.attachedFiles.filter(f => 
        !(f.name === failedFileName && f.isProcessing)
      );
      emit("update:attachedFiles", filteredFiles);
    }
    
    toast.add({
      title: "Processing failed",
      description: errorMessage,
      color: "red",
      icon: "i-heroicons-exclamation-triangle",
    });
  } finally {
    fileInput.value.value = ""; // Reset file input
    loader.value = false;
    processingFileName.value = "";
    processingMessage.value = "";
  }
};

const removeFile = async (fileToRemove) => {
  try {
    await $fetch(`/api/files/${fileToRemove.id}`, {
      method: "DELETE",
    });
    emit(
      "update:attachedFiles",
      props.attachedFiles.filter((file) => file !== fileToRemove),
    );

    toast.add({
      title: "File removed",
      description: `${fileToRemove.name} has been removed`,
      color: "green",
      icon: "i-heroicons-trash",
    });
  } catch (error) {
    console.error("Error removing file:", error);
    toast.add({
      title: "Remove failed",
      description: "Could not remove file",
      color: "red",
      icon: "i-heroicons-exclamation-triangle",
    });
  }
};

const handleSendMessage = async () => {
  if (inputMessage.value.trim() === "" || loader.value) return;

  // Check message length
  if (inputMessage.value.length > 4000) {
    toast.add({
      title: "Message too long",
      description: "Please keep messages under 4000 characters",
      color: "orange",
      icon: "i-heroicons-exclamation-triangle",
    });
    return;
  }

  // Add user message
  const userMessage = {
    id: Date.now() + Math.random(), // Temporary ID
    createdAt: new Date(),
    content: inputMessage.value,
    role: "user",
  };
  messages.value.push(userMessage);

  // Create assistant message placeholder for streaming
  const assistantMessage = {
    id: Date.now() + Math.random() + 1,
    createdAt: new Date(),
    content: "",
    role: "assistant",
  };
  messages.value.push(assistantMessage);

  loader.value = true;
  const messageContent = inputMessage.value;
  inputMessage.value = ""; // Clear input after sending

  try {
    // Use regular fetch for streaming
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: messageContent,
        threadId: route.params.id,
        selectedFiles: selectedFiles.value,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.trim() && line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(5));
              if (data.type === "content_block_delta" && data.delta?.text) {
                // Update the last message with the new content
                const lastMessage = messages.value[messages.value.length - 1];
                if (lastMessage.role === "assistant") {
                  lastMessage.content += data.delta.text;
                }
                // Small delay to allow UI updates
                await new Promise((resolve) => setTimeout(resolve, 10));
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (streamError) {
      console.error("Error reading stream:", streamError);
      toast.add({
        title: "Streaming error",
        description: "Lost connection while receiving response",
        color: "red",
        icon: "i-heroicons-exclamation-circle",
      });
      // Remove assistant message on error
      messages.value.pop();
    }
  } catch (error) {
    console.error("Error sending message:", error);
    toast.add({
      title: "Failed to send",
      description: error.message || "Could not send message",
      color: "red",
      icon: "i-heroicons-exclamation-triangle",
    });
    // Remove both user and assistant messages on error
    messages.value.pop();
    messages.value.pop();
    // Restore the input message
    inputMessage.value = messageContent;
  } finally {
    loader.value = false;
  }
};
</script>
