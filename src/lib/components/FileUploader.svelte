<script lang="ts">
    import { Button } from "./ui/button";
    import { Input } from "./ui/input";
    import { Label } from "./ui/label";
    import Icon from "@iconify/svelte";

    let file: File | null = null;
    let fileLabel = "";
    let uploading = false;
    let uploadingStatus = "Initializing...";
    let uploadingStatusType: "log" | "success" | "error" = "log";
    let uploadSuccessData: { id: string; href: string } | null = null;

    function copyTextToClipboard(text: string) {
        function fallbackCopyTextToClipboard(text: string) {
            var textArea = document.createElement("textarea");
            textArea.value = text;

            // Avoid scrolling to bottom
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.position = "fixed";

            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                var successful = document.execCommand("copy");
                var msg = successful ? "successful" : "unsuccessful";
                console.log("Fallback: Copying text command was " + msg);
            } catch (err) {
                console.error("Fallback: Oops, unable to copy", err);
            }

            document.body.removeChild(textArea);
        }
        if (!navigator.clipboard) {
            fallbackCopyTextToClipboard(text);
            return;
        }
        navigator.clipboard.writeText(text).then(
            function () {
                console.log("Async: Copying to clipboard was successful!");
            },
            function (err) {
                console.error("Async: Could not copy text: ", err);
            }
        );
    }

    function onChangeHandler(event: Event) {
        const target = event.target as HTMLInputElement | null;
        console.log(target?.files);
        file = target?.files?.[0] || null;
    }

    async function handleUpload() {
        if (!file) return;
        // if (!fileLabel) return;
        uploading = true;
        uploadingStatus = "Initializing...";
        uploadingStatusType = "log";
        uploadSuccessData = null;

        const formData = new FormData();

        formData.set("file", file);

        function progressHandler(progress: number) {
            uploading = true;
            uploadingStatus = `${progress.toFixed(2)}%`;
        }
        function successHandler(data: ProgressEvent) {
            const xhr = data.target as XMLHttpRequest;
            const response = JSON.parse(xhr.response);

            if (response.error === true || xhr.status != 200) {
                uploadingStatus = `Upload Failed: ${response.message}`;
                uploadingStatusType = "error";
                return;
            }

            const id = response.data.id;
            uploadSuccessData = {
                id,
                href: `${location.origin}/f/${id}`,
            };

            uploadingStatus = "Successfully Uploaded";
            uploadingStatusType = "success";
        }
        function failHandler() {
            uploadingStatus = "Upload Failed";
            uploadingStatusType = "error";
        }

        const xhr = new XMLHttpRequest();

        // Progress event listener
        xhr.upload.addEventListener("progress", (event: ProgressEvent) => {
            if (event.lengthComputable) {
                const percent = (event.loaded / event.total) * 100;
                progressHandler(percent);
            }
        });

        // Load and error event listeners
        xhr.addEventListener("loadend", successHandler);
        xhr.addEventListener("error", failHandler);

        // Send the file using Fetch API
        xhr.open("POST", "/api/upload");
        xhr.send(formData);
    }
</script>

<div
    class="shadow-sm area-fit p-4 border border-black rounded-md flex-center flex-col min-w-[300px] max-md:min-w-none max-md:w-fit relative"
    class:border-gray-400={uploading}
>
    {#if uploading}
        <div
            class="absolute area-full flex items-center flex-col backdrop-blur-3xl p-3"
        >
            {#if uploadingStatusType === "log"}
                <Icon icon="eos-icons:three-dots-loading" class="text-7xl" />
            {/if}
            <div
                class:text-red-500={uploadingStatusType === "error"}
                class:text-green-500={uploadingStatusType === "success"}
            >
                {uploadingStatus}
                {#if uploadingStatusType === "success"}
                    <br />
                    The File Will be deleted in 12 hours
                {/if}
            </div>

            {#if uploadSuccessData}
                <div class="flex w-full my-3 items-center space-x-1">
                    <Input
                        type="url"
                        readonly
                        disabled
                        placeholder=""
                        on:click={() =>
                            copyTextToClipboard(uploadSuccessData?.href || "")}
                        bind:value={uploadSuccessData.href}
                    />
                    <Button
                        target="_blank"
                        size="sm"
                        class="h-full"
                        href={uploadSuccessData.href}
                        ><Icon icon="mdi:link" /></Button
                    >
                </div>
            {/if}

            {#if uploadingStatusType !== "log"}
                <Button class="my-2" on:click={() => (uploading = false)}
                    >Ok</Button
                >
            {/if}
        </div>
    {/if}

    <h3 class="italic">Upload</h3>
    <hr class="my-2" />

    <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="file">File</Label>
        <Input
            on:change={onChangeHandler}
            id="file"
            type="file"
            multiple={false}
        />
    </div>

    <div class="my-2" />

    <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="label">Label</Label>
        <Input
            bind:value={fileLabel}
            id="label"
            type="text"
            placeholder="My File"
        />
    </div>

    <div class="my-2" />

    <Button on:click={handleUpload} class="w-full">Upload</Button>
</div>
