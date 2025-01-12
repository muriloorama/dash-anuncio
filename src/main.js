import { createClient } from '@supabase/supabase-js'
    import Chart from 'chart.js/auto'

    const supabaseUrl = 'https://jwrmbzptpjwfzsatyfus.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cm1ienB0cGp3ZnpzYXR5ZnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA5NzYyODUsImV4cCI6MjAzNjU1MjI4NX0.RlJ_x0dskejDhxD7w_hOv1BlbAn4Ebh4sxERGT2nkc4'
    const supabase = createClient(supabaseUrl, supabaseKey)

    async function fetchBotSemanal() {
      console.log('Iniciando busca de dados...')
      const { data: qualityData, error: qualityError } = await supabase
        .from('bot_semanal')
        .select('created_at, qualidade_lead')
        .in('qualidade_lead', ['Bom', 'Excelente'])
        .order('created_at', { ascending: true })

      const { data: presenteData, error: presenteError } = await supabase
        .from('bot_semanal')
        .select('created_at')
        .eq('presente_etapa', 'pres_3recebeu-presente')
        .order('created_at', { ascending: true })

      if (qualityError || presenteError) {
        console.error('Erro ao buscar dados:', qualityError || presenteError)
        return
      }

      console.log('Dados recebidos:', { qualityData, presenteData })
      renderCharts(qualityData, presenteData)
    }

    function renderCharts(qualityData, presenteData) {
      // Gráfico 1: Qualidade de Lead por Data
      const qualityByDate = qualityData.reduce((acc, item) => {
        const date = new Date(item.created_at).toLocaleDateString()
        const quality = item.qualidade_lead
        if (!acc[date]) acc[date] = { Bom: 0, Excelente: 0, Total: 0 }
        acc[date][quality]++
        acc[date].Total++
        return acc
      }, {})

      const dates = Object.keys(qualityByDate)
      const bomData = dates.map(date => qualityByDate[date].Bom)
      const excelenteData = dates.map(date => qualityByDate[date].Excelente)
      const totalData = dates.map(date => qualityByDate[date].Total)

      new Chart(document.getElementById('qualityByDateChart'), {
        type: 'bar',
        data: {
          labels: dates,
          datasets: [
            {
              label: 'Bom',
              data: bomData,
              backgroundColor: 'rgba(54, 162, 235, 0.6)'
            },
            {
              label: 'Excelente',
              data: excelenteData,
              backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || ''
                  const value = context.raw || 0
                  const total = totalData[context.dataIndex]
                  return `${label}: ${value} (Total: ${total})`
                }
              }
            }
          }
        }
      })

      // Gráfico 2: Evolução da Quantidade Total de Bom e Excelente
      new Chart(document.getElementById('qualityOverTimeChart'), {
        type: 'line',
        data: {
          labels: dates,
          datasets: [
            {
              label: 'Bom',
              data: bomData,
              borderColor: 'rgba(54, 162, 235, 1)',
              fill: false
            },
            {
              label: 'Excelente',
              data: excelenteData,
              borderColor: 'rgba(75, 192, 192, 1)',
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      })

      // Gráfico 3: Contagem de Registros (pres_3recebeu-presente) por Data
      const presenteByDate = presenteData.reduce((acc, item) => {
        const date = new Date(item.created_at).toLocaleDateString()
        if (!acc[date]) acc[date] = 0
        acc[date]++
        return acc
      }, {})

      const presenteDates = Object.keys(presenteByDate)
      const presenteCounts = Object.values(presenteByDate)

      new Chart(document.getElementById('presenteByDateChart'), {
        type: 'bar',
        data: {
          labels: presenteDates,
          datasets: [
            {
              label: 'Registros',
              data: presenteCounts,
              backgroundColor: 'rgba(255, 99, 132, 0.6)'
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw || 0
                  return `Registros: ${value}`
                }
              }
            }
          }
        }
      })
    }

    fetchBotSemanal()
