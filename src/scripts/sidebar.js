const sidebar = document.getElementById('sidebar')

if (sidebar) {
  const toggleSidebarMobile = (sidebar, toggleSidebarMobileHamburger, toggleSidebarMobileClose) => {
    sidebar.classList.toggle('hidden')
    toggleSidebarMobileHamburger.classList.toggle('hidden')
    toggleSidebarMobileClose.classList.toggle('hidden')
  }

  const toggleSidebarMobileEl = document.getElementById('toggleSidebarMobile')
  const toggleSidebarMobileHamburger = document.getElementById('toggleSidebarMobileHamburger')
  const toggleSidebarMobileClose = document.getElementById('toggleSidebarMobileClose')

  toggleSidebarMobileEl.addEventListener('click', () => {
    toggleSidebarMobile(sidebar, toggleSidebarMobileHamburger, toggleSidebarMobileClose)
  })
}
