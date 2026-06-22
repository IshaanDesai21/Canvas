<script lang="ts">
  import Dashboard from '$layouts/Dashboard.svelte';
  // Stores are instantiated on import so their persistence effects start early.
  import '$stores/theme.svelte';
</script>

<svelte:head>
  <title>New Tab</title>
</svelte:head>

<Dashboard />
