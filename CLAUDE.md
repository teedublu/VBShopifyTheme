# VBShopifyTheme

Shopify theme for voxblock.co.uk. The project's working notes live in Google Drive, not in this
repo: the GRO folder (`145BBd79ZV0cyK4FpktRXOZaX74g6OfZ-`) holds `STATUS.md` and `HANDOFF.md`,
and each folder in `GRO/sub-projects` (`1XFsDCLYVzO5b4bRlCpZyKs4nZ7ixJDp9`) has its own
`STATUS.md`.

## Updating Markdown files in Google Drive

The Drive connector can't change what is inside an existing file: `update_file` only renames or
moves it. To update a `.md` file anywhere in the GRO folder, replace it instead. Tom has approved
this, so do it rather than stopping to ask. For anything else in Drive, ask first.

1. **Find it.** `search_files` with `title = 'STATUS.md' and parentId = '<folder id>'`. Several
   folders have a `STATUS.md`, so always filter by folder. Note the file's `id` and `fileSize`.
2. **Read it just before you write.** Other threads work in these folders at the same time. Use
   `read_file_content`. It escapes the Markdown (`\#`, `\-`, `\[`, and two spaces before every
   line break), so write the new version as clean Markdown and never paste the escaped text back
   in.
3. **Create the replacement.** `create_file` with the same `title`, `parentId` set to the same
   folder, the whole new text in `textContent`, `contentMimeType: "text/markdown"` and
   `disableConversionToGoogleType: true`. Without that flag Drive turns the file into a Google
   Doc. This replaces the entire file, so carry over everything you aren't deliberately changing.
4. **Check it.** The result should show `mimeType` `text/markdown` and a `fileSize` near the old
   one, unless you meant to cut or add a lot. Read it back: headings should come back as `\#`.
   If they come back as `\\\#`, escaped text went in; trash the new file and redo step 3.
5. **Trash the old file.** `trash_file` with the old `id`. It stays in Drive's trash for 30 days.
6. **Search the folder again.** Trashed files don't show up, so there should be exactly one file
   with that name. Two means another thread replaced it at the same moment: merge them into one
   new file, trash both, and say so.

The replacement has a new link, so give its `viewUrl` when you report back.

If you can reach the GRO folder on the connected computer (`$HOME/mnt/tom_voxblock/GRO`, via
`device_bash`), edit the file there in place instead. That keeps the same file, link and version
history.
