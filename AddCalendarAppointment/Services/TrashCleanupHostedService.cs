using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AddCalendarAppointment.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace AddCalendarAppointment.Services
{
    public class TrashCleanupHostedService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;

        public TrashCleanupHostedService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var limitDate = DateTime.UtcNow.AddDays(-30);

                    var expiredEvents = await context.Appointments
                        .IgnoreQueryFilters()
                        .Where(a => a.IsDeleted && a.DeletedDate != null && a.DeletedDate < limitDate)
                        .ToListAsync(stoppingToken);

                    if (expiredEvents.Any())
                    {
                        context.Appointments.RemoveRange(expiredEvents);
                        await context.SaveChangesAsync(stoppingToken);
                    }
                }

                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}