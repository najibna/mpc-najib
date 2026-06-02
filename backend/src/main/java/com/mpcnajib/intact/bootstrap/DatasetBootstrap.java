package com.mpcnajib.intact.bootstrap;

import com.mpcnajib.intact.config.AppProperties;
import com.mpcnajib.intact.service.DatasetService;
import com.mpcnajib.intact.service.HomeService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.stereotype.Component;

@Component
public class DatasetBootstrap {
  private final DatasetService datasets;
  private final HomeService home;
  private final AppProperties props;

  public DatasetBootstrap(DatasetService datasets, HomeService home, AppProperties props) {
    this.datasets = datasets;
    this.home = home;
    this.props = props;
  }

  @EventListener(ApplicationReadyEvent.class)
  public void onReady() {
    if (datasets.isLoaded()) return;
    try {
      var loader = new DefaultResourceLoader();
      var resource = loader.getResource(props.sampleDataPath());
      if (!resource.exists()) {
        resource = loader.getResource("classpath:sample_data/dummy_data.xlsx");
      }
      datasets.loadDemo(resource);
      home.buildHome();
    } catch (Exception e) {
      // demo optional at startup
    }
  }
}
