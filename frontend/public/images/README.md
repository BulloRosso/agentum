# Public Images Directory

This directory contains static image assets that are available for use in the frontend React application.

## How to Use These Images

Images in this directory can be directly referenced in your React components using the root URL path. Since they're in the public directory, Vite will automatically make them available.

### Example Usage

```jsx
// In a React component
function Logo() {
  return (
    <img src="/images/logo.svg" alt="Logo" />
  );
}

// For background images in CSS
const styles = {
  backgroundImage: "url('/images/workflow-icon.svg')"
};
```

## Available Images

- `logo.svg` - Main application logo
- `workflow-icon.svg` - Icon for workflow-related features

## Notes

- Any file placed in this directory will be accessible at the URL path `/images/filename`
- The images are copied as-is during the build process
- For images that are imported directly by components, consider placing them in the `src/assets` folder instead