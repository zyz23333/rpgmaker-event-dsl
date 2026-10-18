---
status: accepted
---

# Static map rendering with project image assets

We decided to implement native MV static Map Preview rendering inside the tool, with image-processing capabilities supplied by package dependencies. Ordinary rendering does not require a separately configured browser, a running MV game, or execution of project engine and plugin scripts. This accepts the cost of implementing and visually verifying native map drawing rules in exchange for a directly callable CLI capability with the same package distribution model as the existing workflow.

Map Image Assets are read on demand from the configured Project Root, even when the map data comes from the Project Data Snapshot or Generated Project Data. Rendering records the source and content hash of each image it uses, separately from project-data provenance. Images are not added to Clone or Pull, and asset hashes do not become part of the existing Compile Baseline; this avoids expanding snapshot ownership and synchronization cost, while making it possible to identify which live image versions contributed to a preview.

This is not historical asset archival. Replacing an image under the same name can change a subsequent preview of unchanged map data, and a prior content hash cannot recover an overwritten image. Renderer dependencies and detailed drawing rules remain implementation choices within this boundary.
