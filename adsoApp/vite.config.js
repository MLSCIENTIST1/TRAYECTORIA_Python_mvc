export default {
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // Ignora las advertencias relacionadas con dynamic import
          if (warning.code === 'UNRESOLVED_IMPORT') return;
          warn(warning);
        }
      }
    }
  };